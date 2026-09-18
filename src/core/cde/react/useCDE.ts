import React from 'react';
import { useCDEState } from './CDEProvider';
import { CDE } from '../CDE';

export const useCDE = () => {
    const state = useCDEState();
    
    const [pendingOpsCount, setPendingOpsCount] = React.useState(0);
    const [lastSync, setLastSync] = React.useState<number | null>(null);

    React.useEffect(() => {
        let isMounted = true;
        const fetchPending = async () => {
             const meta = await CDE.getMetadata();
             if (isMounted && meta) setLastSync(meta.lastSync);
             const ops = await CDE.getPendingOperations();
             if (isMounted) setPendingOpsCount(ops.length);
        };
        fetchPending();
        const interval = setInterval(fetchPending, 2000);
        return () => { isMounted = false; clearInterval(interval); };
    }, []);

    return {
        ...state,
        pendingOpsCount,
        lastSync,
        permen: state.profile?.permen ?? 0,
        addPermen: async (amount: number) => {
            await CDE.queueMutation('MUTATE_PERMEN', { amount });
        },
        forceSync: async () => {
            await CDE.sync();
        },
        queueMutation: async (type: any, payload: any) => {
            await CDE.queueMutation(type, payload);
        }
    };
};
