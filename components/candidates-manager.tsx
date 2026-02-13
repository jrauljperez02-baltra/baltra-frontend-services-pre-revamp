'use client';

import { useState } from 'react';
import { CandidatesTable } from './candidates-table-hired';

export function CandidatesManager() {
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('');

    const handleSearchChange = (search: string) => {
        setSearchTerm(search);
    };

    const handleStatusFilter = (status: string) => {
        setStatusFilter(status);
    };

    return (
        <div className="space-y-6">
            <CandidatesTable
                searchTerm={searchTerm}
                status={statusFilter}
                onSearchChange={handleSearchChange}
                onStatusFilter={handleStatusFilter}
            />
        </div>
    );
}
