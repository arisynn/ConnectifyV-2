"""End-to-end CDE mutate_state API tests (mock backend)."""
import uuid
import pytest


# ---------- basic auth / provision / get_profile ----------
class TestAuthAndProvision:
    def test_get_profile_requires_auth(self, base_url):
        import requests
        r = requests.get(f"{base_url}/api/cde?action=get_profile")
        assert r.status_code == 401

    def test_provision_and_get_profile(self, user_session, helpers):
        profile = helpers.get_profile(user_session)
        assert profile is not None
        assert profile["permen"] == 0
        assert profile["revision"] >= 1


# ---------- PROCESS_WIN ----------
class TestProcessWin:
    def test_process_win_awards_permen_and_missions(self, user_session, helpers):
        p = helpers.get_profile(user_session)
        r = helpers.mutate(user_session, "PROCESS_WIN", {
            "game": "onet", "isFlawless": False, "timeElapsed": 60000,
            "progress": 60, "highestCombo": 6, "isWinner": True,
            "score": 1000, "matches": 20, "isDailyChallenge": False,
        }, p["revision"])
        assert r.status_code == 200, r.text
        new_p = helpers.get_profile(user_session)
        assert new_p["permen"] > 0, "permen should increase"
        pdata = new_p["profile_data"]["profile"]
        assert "activeMissions" in pdata and len(pdata["activeMissions"]) == 5
        assert "activeWeeklyMissions" in pdata and len(pdata["activeWeeklyMissions"]) == 5
        # chestProgress or chestSlots should reflect
        assert pdata.get("chestProgress", 0) > 0 or len(pdata.get("chestSlots", [])) > 0

    def test_daily_challenge_bonus_only_once(self, user_session, helpers):
        p = helpers.get_profile(user_session)
        payload = {"game": "onet", "isFlawless": False, "timeElapsed": 60000,
                   "progress": 60, "highestCombo": 3, "isWinner": True,
                   "score": 500, "matches": 10, "isDailyChallenge": True}
        r1 = helpers.mutate(user_session, "PROCESS_WIN", payload, p["revision"])
        assert r1.status_code == 200, r1.text
        p1 = helpers.get_profile(user_session)
        first_permen = p1["permen"]
        assert first_permen >= 500, f"first daily bonus should include +500, got {first_permen}"

        r2 = helpers.mutate(user_session, "PROCESS_WIN", payload, p1["revision"])
        assert r2.status_code == 200, r2.text
        p2 = helpers.get_profile(user_session)
        delta = p2["permen"] - first_permen
        # Should NOT include another +500
        assert delta < 500, f"second daily bonus must not add another 500, delta={delta}"


# ---------- PURCHASE_ITEM / USE_ITEM ----------
class TestItemsPurchaseUse:
    def _seed_permen(self, session, helpers, amount=3000):
        p = helpers.get_profile(session)
        # Use PROCESS_WIN repeatedly to add permen
        rev = p["revision"]
        while True:
            cur = helpers.get_profile(session)
            if cur["permen"] >= amount:
                return cur
            r = helpers.mutate(session, "PROCESS_WIN", {
                "game": "onet", "isFlawless": True, "timeElapsed": 30000,
                "progress": 80, "highestCombo": 15, "isWinner": True,
                "score": 3000, "matches": 30, "isDailyChallenge": False,
            }, cur["revision"])
            assert r.status_code == 200, r.text

    @pytest.mark.parametrize("item,cost", [("hint", 250), ("shuffle", 300), ("hammer", 400), ("bomb", 600)])
    def test_purchase_item_deducts_and_increments(self, user_session, helpers, item, cost):
        self._seed_permen(user_session, helpers, cost + 100)
        p = helpers.get_profile(user_session)
        field = {"hint": "hints", "shuffle": "shuffles", "hammer": "hammers", "bomb": "bombs"}[item]
        cur_count = p["profile_data"].get("profile", {}).get(field, 3)
        before = p["permen"]
        r = helpers.mutate(user_session, "PURCHASE_ITEM", {"itemId": item}, p["revision"])
        assert r.status_code == 200, r.text
        p2 = helpers.get_profile(user_session)
        assert p2["permen"] == before - cost
        assert p2["profile_data"]["profile"][field] == cur_count + 1

    def test_purchase_theme_ocean(self, user_session, helpers):
        self._seed_permen(user_session, helpers, 1100)
        p = helpers.get_profile(user_session)
        before = p["permen"]
        r = helpers.mutate(user_session, "PURCHASE_ITEM", {"itemId": "theme_ocean"}, p["revision"])
        assert r.status_code == 200, r.text
        p2 = helpers.get_profile(user_session)
        assert p2["permen"] == before - 1000
        assert "ocean" in p2["profile_data"]["profile"].get("unlockedThemes", [])

    def test_purchase_insufficient_permen(self, user_session, helpers):
        p = helpers.get_profile(user_session)
        r = helpers.mutate(user_session, "PURCHASE_ITEM", {"itemId": "hammer"}, p["revision"])
        assert r.status_code == 400
        assert r.json().get("error") == "INSUFFICIENT_PERMEN"

    def test_use_item_decrements(self, user_session, helpers):
        p = helpers.get_profile(user_session)
        # Fresh account should have default counts (3 each)
        r = helpers.mutate(user_session, "USE_ITEM", {"itemId": "hint"}, p["revision"])
        assert r.status_code == 200, r.text
        p2 = helpers.get_profile(user_session)
        assert p2["profile_data"]["profile"].get("hints", 3) == 2


# ---------- CLAIM_MISSION_REWARD ----------
class TestMissions:
    def test_claim_incomplete_mission_fails(self, user_session, helpers):
        p = helpers.get_profile(user_session)
        # Trigger PROCESS_WIN to generate missions
        r = helpers.mutate(user_session, "PROCESS_WIN", {
            "game": "onet", "isWinner": True, "score": 100, "matches": 2,
            "timeElapsed": 60000, "progress": 30, "highestCombo": 1,
        }, p["revision"])
        assert r.status_code == 200
        p2 = helpers.get_profile(user_session)
        missions = p2["profile_data"]["profile"]["activeMissions"]
        # Find one that is not complete
        incomplete = next((m for m in missions if m["progress"] < m["target"]), None)
        assert incomplete is not None
        r2 = helpers.mutate(user_session, "CLAIM_MISSION_REWARD",
                            {"missionId": incomplete["id"]}, p2["revision"])
        assert r2.status_code == 400
        assert r2.json().get("error") in ("MISSION_NOT_COMPLETE", "MISSION_NOT_FOUND")


# ---------- UPDATE_PROFILE (protected fields) ----------
class TestUpdateProfile:
    def test_only_protected_fields_ignored(self, user_session, helpers):
        p = helpers.get_profile(user_session)
        r = helpers.mutate(user_session, "UPDATE_PROFILE",
                           {"hints": 999, "permen": 100000}, p["revision"])
        assert r.status_code == 200
        body = r.json()
        assert body.get("ignored") is True
        assert body.get("reason") == "NO_WRITABLE_FIELDS"
        # Confirm nothing changed
        p2 = helpers.get_profile(user_session)
        assert p2["permen"] == p["permen"]


# ---------- STALE REVISION ----------
class TestStaleRevision:
    def test_stale_revision_returns_409(self, user_session, helpers):
        p = helpers.get_profile(user_session)
        # do a valid mutate first
        r1 = helpers.mutate(user_session, "USE_ITEM", {"itemId": "hint"}, p["revision"])
        assert r1.status_code == 200
        # replay with old revision
        r2 = helpers.mutate(user_session, "USE_ITEM", {"itemId": "hint"}, p["revision"])
        assert r2.status_code == 409, r2.text
        assert r2.json().get("error") == "CONFLICT_STALE_REVISION"


# ---------- CLAIM_ACHIEVEMENT_REWARD ----------
class TestAchievements:
    def test_claim_high_score_after_2500(self, user_session, helpers):
        p = helpers.get_profile(user_session)
        r = helpers.mutate(user_session, "PROCESS_WIN", {
            "game": "onet", "isWinner": True, "score": 3000, "matches": 30,
            "timeElapsed": 60000, "progress": 80, "highestCombo": 10,
        }, p["revision"])
        assert r.status_code == 200
        p2 = helpers.get_profile(user_session)
        before = p2["permen"]
        r2 = helpers.mutate(user_session, "CLAIM_ACHIEVEMENT_REWARD",
                            {"achievementId": "high_score"}, p2["revision"])
        assert r2.status_code == 200, r2.text
        p3 = helpers.get_profile(user_session)
        assert p3["permen"] - before == 200
        # second claim should fail
        r3 = helpers.mutate(user_session, "CLAIM_ACHIEVEMENT_REWARD",
                            {"achievementId": "high_score"}, p3["revision"])
        assert r3.status_code == 400, r3.text


# ---------- OPEN_CHEST / SPEED_UP_CHEST ----------
class TestChest:
    def test_open_chest_not_ready(self, user_session, helpers):
        p = helpers.get_profile(user_session)
        r = helpers.mutate(user_session, "OPEN_CHEST", {"slotId": 0}, p["revision"])
        # No chest yet
        assert r.status_code == 400
        assert r.json().get("error") in ("CHEST_NOT_READY", "CHEST_EMPTY")

    def test_speed_up_chest_flow(self, user_session, helpers):
        # Play enough games to fill a chest slot
        for _ in range(10):
            p = helpers.get_profile(user_session)
            r = helpers.mutate(user_session, "PROCESS_WIN", {
                "game": "onet", "isWinner": True, "score": 500, "matches": 10,
                "timeElapsed": 60000, "progress": 60, "highestCombo": 5,
            }, p["revision"])
            assert r.status_code == 200
            slots = helpers.get_profile(user_session)["profile_data"]["profile"].get("chestSlots", [])
            if slots:
                break

        p = helpers.get_profile(user_session)
        slots = p["profile_data"]["profile"].get("chestSlots", [])
        if not slots:
            pytest.skip("No chest slot generated in mock (chest.js gating)")
        # chestSlots is a fixed-length list with nulls for empty slots
        slot = next((s for s in slots if s), None)
        if not slot:
            pytest.skip("No filled chest slot yet")
        slot_id = slot.get("id", slot.get("slotId", 0))
        # Speed up (deducts small permen)
        r = helpers.mutate(user_session, "SPEED_UP_CHEST", {"slotId": slot_id}, p["revision"])
        # This may fail if already ready or not enough permen; accept either 200 or 400 with sensible error
        if r.status_code == 200:
            p2 = helpers.get_profile(user_session)
            r_open = helpers.mutate(user_session, "OPEN_CHEST", {"slotId": slot_id}, p2["revision"])
            assert r_open.status_code == 200, r_open.text
        else:
            assert r.json().get("error") in ("INSUFFICIENT_PERMEN", "CHEST_ALREADY_READY")
