import { randomUUID } from 'crypto';

export interface Offer {
    offerId: string;
    roomId: string;
    host: string;
    member: string;
    amount: number;
    currency: string;
    status: 'PENDING' | 'ACCEPTED' | 'REJECTED' | 'CANCELLED';
    createdAt: number;
    guestId?: string;
}

class Engine {
    private offers = new Map<string, Offer>();
    private banks = new Map<string, any>();

    cancelRoomOffers(roomId: string) {
        for (const [id, offer] of this.offers.entries()) {
            if (offer.roomId === roomId && offer.status === 'PENDING') {
                offer.status = 'CANCELLED';
            }
        }
    }

    async createOffer(roomId: string, host: string, member: string, amount: number, currency: string): Promise<Offer> {
        this.cancelRoomOffers(roomId);
        const offer: Offer = {
            offerId: randomUUID(),
            roomId,
            host,
            member,
            amount,
            currency,
            status: 'PENDING',
            createdAt: Date.now()
        };
        this.offers.set(offer.offerId, offer);
        return offer;
    }

    cancelOffer(offerId: string, host: string): Offer {
        const offer = this.offers.get(offerId);
        if (!offer) throw new Error('Offer not found');
        if (offer.host !== host) throw new Error('Unauthorized');
        offer.status = 'CANCELLED';
        return offer;
    }

    async acceptOffer(offerId: string, name: string): Promise<Offer> {
        const offer = this.offers.get(offerId);
        if (!offer) throw new Error('Offer not found');
        if (offer.member !== name) throw new Error('Unauthorized');
        if (offer.status !== 'PENDING') throw new Error('Offer is not pending');
        offer.status = 'ACCEPTED';
        return offer;
    }

    rejectOffer(offerId: string, name: string): Offer {
        const offer = this.offers.get(offerId);
        if (!offer) throw new Error('Offer not found');
        if (offer.member !== name) throw new Error('Unauthorized');
        offer.status = 'REJECTED';
        return offer;
    }

    async setupBank(offer: Offer, updatePlayerBalance: (playerName: string, currency: string, delta: number) => Promise<number>) {
        const hBalance = await updatePlayerBalance(offer.host, offer.currency, -offer.amount);
        const mBalance = await updatePlayerBalance(offer.member, offer.currency, -offer.amount);

        const bank = {
            id: randomUUID(),
            offerId: offer.offerId,
            pool: offer.amount * 2,
            currency: offer.currency
        };
        this.banks.set(offer.offerId, bank);

        return {
            bank,
            newBalances: {
                host: hBalance,
                member: mBalance
            }
        };
    }
}

export const MultiplayerBankEngine = new Engine();
