import { Suspense } from 'react';
import CheckInPage from './CheckInPage';

export default function Page() {
    return (
        <Suspense fallback={<div>Loading...</div>}>
            <CheckInPage />
        </Suspense>
    );
}
