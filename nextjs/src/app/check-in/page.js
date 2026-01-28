import { Suspense } from 'react';
import CheckInPage from './CheckInPage';
import CheckInSkeleton from './CheckInSkeleton';

export default function Page() {
    return (
        <Suspense fallback={<CheckInSkeleton />}>
            <CheckInPage />
        </Suspense>
    );
}
