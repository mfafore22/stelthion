/**
 * Household Data Modal
 * Displays detailed household statistics for catchment areas
 */

'use client';

import React, { useState, useMemo } from 'react';
import { X, Search, Download, Database, Home, Users, Key, Building2 } from 'lucide-react';
import type { MallHouseholdData, HouseholdData } from '@/lib/types/household';

interface HouseholdDataModalProps {
  data: MallHouseholdData;
  isOpen: boolean;
  onClose: () => void;
}

export function HouseholdDataModal({ data, isOpen, onClose }: HouseholdDataModalProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Filter data based on search
  const filteredData = useMemo(() => {
    if (!searchTerm) return data.catchmentAreas;

    const term = searchTerm.toLowerCase();
    return data.catchmentAreas.filter(
      area =>
        area.postalCode.includes(term) ||
        area.area.toLowerCase().includes(term)
    );
  }, [data.catchmentAreas, searchTerm]);

  // Pagination
  const totalPages = Math.ceil(filteredData.length / itemsPerPage);
  const paginatedData = filteredData.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // Format percentage
  const formatPercent = (value: number) => `${value.toFixed(1)}%`;

  // Format number with thousand separators
  const formatNumber = (value: number) => value.toLocaleString('fi-FI');

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-bo-glass border border-bo-neutral-200/30 shadow-bo-glass rounded-xl max-w-6xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-bo-neutral-200/30">
          <div>
            <h2 className="text-2xl font-semibold text-bo-neutral-950 mb-1">
              Household Statistics by Area
            </h2>
            <div className="flex items-center gap-2 text-sm text-bo-neutral-600">
              <Database className="h-4 w-4" />
              <span>{data.dataSource}</span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-bo-neutral-200/50 transition-colors"
            aria-label="Close modal"
          >
            <X className="h-6 w-6 text-bo-neutral-700" />
          </button>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-4 gap-4 p-6 border-b border-bo-neutral-200/30 bg-bo-glass-subtle">
          <div className="text-center">
            <div className="flex justify-center mb-2">
              <Home className="h-5 w-5 text-bo-info-dark" />
            </div>
            <div className="text-2xl font-bold text-bo-neutral-950">
              {formatNumber(data.summary.totalHouseholds)}
            </div>
            <div className="text-xs text-bo-neutral-600">Total Households</div>
          </div>
          <div className="text-center">
            <div className="flex justify-center mb-2">
              <Users className="h-5 w-5 text-bo-success-dark" />
            </div>
            <div className="text-2xl font-bold text-bo-neutral-950">
              {data.summary.averageHouseholdSize.toFixed(2)}
            </div>
            <div className="text-xs text-bo-neutral-600">Avg Household Size</div>
          </div>
          <div className="text-center">
            <div className="flex justify-center mb-2">
              <Key className="h-5 w-5 text-bo-accent-700" />
            </div>
            <div className="text-2xl font-bold text-bo-neutral-950">
              {formatPercent(data.summary.ownershipRate)}
            </div>
            <div className="text-xs text-bo-neutral-600">Home Ownership</div>
          </div>
          <div className="text-center">
            <div className="flex justify-center mb-2">
              <Building2 className="h-5 w-5 text-bo-primary-700" />
            </div>
            <div className="text-2xl font-bold text-bo-neutral-950 capitalize">
              {data.summary.predominantType}
            </div>
            <div className="text-xs text-bo-neutral-600">Predominant Type</div>
          </div>
        </div>

        {/* Search and Controls */}
        <div className="p-6 border-b border-bo-neutral-200/30">
          <div className="flex items-center gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-bo-neutral-500" />
              <input
                type="text"
                placeholder="Search by postal code or area name..."
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setCurrentPage(1); // Reset to first page on search
                }}
                className="w-full pl-10 pr-4 py-2 rounded-lg border border-bo-neutral-300 bg-white/50 text-bo-neutral-950 placeholder-bo-neutral-500 focus:outline-none focus:ring-2 focus:ring-bo-primary-400"
              />
            </div>
            <button
              className="px-4 py-2 rounded-lg bg-bo-primary-100 text-bo-primary-700 hover:bg-bo-primary-200 transition-colors flex items-center gap-2 text-sm font-medium"
              onClick={() => {
                // Export functionality could be added here
                alert('Export functionality coming soon!');
              }}
            >
              <Download className="h-4 w-4" />
              Export
            </button>
          </div>
          <div className="mt-2 text-xs text-bo-neutral-600">
            Showing {filteredData.length} of {data.catchmentAreas.length} areas
          </div>
        </div>

        {/* Table */}
        <div className="flex-1 overflow-auto p-6">
          <table className="w-full text-sm">
            <thead className="sticky top-0 bg-bo-glass-strong z-10">
              <tr className="border-b-2 border-bo-neutral-300">
                <th className="text-left p-3 font-semibold text-bo-neutral-950">Postal Code</th>
                <th className="text-left p-3 font-semibold text-bo-neutral-950">Area</th>
                <th className="text-right p-3 font-semibold text-bo-neutral-950">Households</th>
                <th className="text-right p-3 font-semibold text-bo-neutral-950">Avg Size</th>
                <th className="text-right p-3 font-semibold text-bo-neutral-950">1-Person</th>
                <th className="text-right p-3 font-semibold text-bo-neutral-950">2-Person</th>
                <th className="text-right p-3 font-semibold text-bo-neutral-950">3+ Person</th>
                <th className="text-right p-3 font-semibold text-bo-neutral-950">Owned</th>
                <th className="text-right p-3 font-semibold text-bo-neutral-950">Rented</th>
              </tr>
            </thead>
            <tbody>
              {paginatedData.map((area, index) => {
                const threePlus = area.households.threePerson + area.households.fourPerson + area.households.fivePlusPerson;
                const onePersonPct = (area.households.onePerson / area.households.total) * 100;
                const twoPersonPct = (area.households.twoPerson / area.households.total) * 100;
                const threePlusPct = (threePlus / area.households.total) * 100;

                return (
                  <tr
                    key={`${area.postalCode}-${index}`}
                    className="border-b border-bo-neutral-200/30 hover:bg-bo-primary-50/30 transition-colors"
                  >
                    <td className="p-3 font-mono font-semibold text-bo-neutral-950">{area.postalCode}</td>
                    <td className="p-3 text-bo-neutral-700">{area.area}</td>
                    <td className="p-3 text-right text-bo-neutral-950 font-medium">
                      {formatNumber(area.households.total)}
                    </td>
                    <td className="p-3 text-right text-bo-neutral-950">
                      {area.averageHouseholdSize.toFixed(2)}
                    </td>
                    <td className="p-3 text-right text-bo-neutral-700">
                      <div>{formatNumber(area.households.onePerson)}</div>
                      <div className="text-xs text-bo-neutral-500">{formatPercent(onePersonPct)}</div>
                    </td>
                    <td className="p-3 text-right text-bo-neutral-700">
                      <div>{formatNumber(area.households.twoPerson)}</div>
                      <div className="text-xs text-bo-neutral-500">{formatPercent(twoPersonPct)}</div>
                    </td>
                    <td className="p-3 text-right text-bo-neutral-700">
                      <div>{formatNumber(threePlus)}</div>
                      <div className="text-xs text-bo-neutral-500">{formatPercent(threePlusPct)}</div>
                    </td>
                    <td className="p-3 text-right">
                      <div className="text-bo-success-dark font-medium">
                        {formatNumber(area.ownership.owned)}
                      </div>
                      <div className="text-xs text-bo-neutral-500">
                        {formatPercent(area.ownership.ownershipRate)}
                      </div>
                    </td>
                    <td className="p-3 text-right text-bo-neutral-700">
                      {formatNumber(area.ownership.rented)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          {paginatedData.length === 0 && (
            <div className="text-center py-12 text-bo-neutral-600">
              <Home className="h-12 w-12 mx-auto mb-3 opacity-30" />
              <p>No areas found matching "{searchTerm}"</p>
            </div>
          )}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between p-6 border-t border-bo-neutral-200/30 bg-bo-glass-subtle">
            <div className="text-sm text-bo-neutral-600">
              Page {currentPage} of {totalPages}
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="px-4 py-2 rounded-lg bg-white/50 text-bo-neutral-700 hover:bg-white/80 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
              >
                Previous
              </button>
              <button
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="px-4 py-2 rounded-lg bg-white/50 text-bo-neutral-700 hover:bg-white/80 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
