'use client';

import CompareWithPopover from './CompareWithPopover.jsx';
import ColumnsPopover from './ColumnsPopover.jsx';

/**
 * Toolbar above the report card — comparison + column controls.
 * Lives in the main scrollable area, not in the modal header.
 */
export default function ReportToolbar() {
  return (
    <div className="flex flex-wrap items-center gap-2.5 mb-4">
      <CompareWithPopover />
      <ColumnsPopover />
      <div className="grow" />
    </div>
  );
}