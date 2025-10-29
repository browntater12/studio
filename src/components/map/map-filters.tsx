'use client';

import * as React from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '../ui/skeleton';

interface MapFiltersProps {
  statusFilter: string;
  setStatusFilter: (value: string) => void;
  industryFilter: string;
  setIndustryFilter: (value: string) => void;
  industries: string[];
  isLoading: boolean;
}

export function MapFilters({
  statusFilter,
  setStatusFilter,
  industryFilter,
  setIndustryFilter,
  industries,
  isLoading
}: MapFiltersProps) {
    const statusOptions = ['lead', 'customer', 'key-account'];
  return (
    <Card className="rounded-none border-x-0 border-t-0">
      <CardContent className="p-2">
        {isLoading ? (
            <div className="flex items-center gap-4">
                <Skeleton className="h-9 w-48" />
                <Skeleton className="h-9 w-48" />
            </div>
        ) : (
            <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-2">
                <label className="text-sm font-medium">Status</label>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-48">
                    <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="all">All Statuses</SelectItem>
                    {statusOptions.map(status => (
                        <SelectItem key={status} value={status} className="capitalize">{status.replace('-', ' ')}</SelectItem>
                    ))}
                </SelectContent>
                </Select>
            </div>
            <div className="flex items-center gap-2">
                <label className="text-sm font-medium">Industry</label>
                <Select value={industryFilter} onValueChange={setIndustryFilter}>
                <SelectTrigger className="w-48">
                    <SelectValue placeholder="Filter by industry" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="all">All Industries</SelectItem>
                    {industries.map(industry => (
                        <SelectItem key={industry} value={industry}>{industry}</SelectItem>
                    ))}
                </SelectContent>
                </Select>
            </div>
            </div>
        )}
      </CardContent>
    </Card>
  );
}
