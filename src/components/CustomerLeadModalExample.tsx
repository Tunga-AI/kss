import React, { useState } from 'react';
import CustomerLeadModal from './CustomerLeadModal';

// Example component showing how to use the CustomerLeadModal
const CustomerLeadModalExample: React.FC = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedProgram, setSelectedProgram] = useState<{
    id: string;
    name: string;
  } | null>(null);

  const openModal = (programId?: string, programName?: string) => {
    if (programId && programName) {
      setSelectedProgram({ id: programId, name: programName });
    }
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedProgram(null);
  };

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-4">Customer Lead Modal Examples</h2>
      
      <div className="space-y-4">
        {/* Example 1: Open modal without pre-selected program */}
        <button
          onClick={() => openModal()}
          className="bg-primary-600 text-white px-6 py-3 rounded-lg hover:bg-primary-700 transition-colors"
        >
          Open Lead Form (No Program Selected)
        </button>

        {/* Example 2: Open modal with pre-selected program */}
        <button
          onClick={() => openModal('program-123', 'Advanced Sales Management')}
          className="bg-secondary-600 text-white px-6 py-3 rounded-lg hover:bg-secondary-700 transition-colors ml-4"
        >
          Open Lead Form (Program Pre-selected)
        </button>

        {/* Example 3: Program card with lead button */}
        <div className="bg-white border border-gray-200 rounded-lg p-6 max-w-md">
          <h3 className="text-lg font-semibold mb-2">Digital Marketing Program</h3>
          <p className="text-gray-600 mb-4">
            Learn the latest digital marketing strategies and tools to grow your business.
          </p>
          <button
            onClick={() => openModal('digital-marketing-001', 'Digital Marketing Program')}
            className="w-full bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700 transition-colors"
          >
            Get More Information
          </button>
        </div>
      </div>

      {/* The Modal */}
      <CustomerLeadModal
        isOpen={isModalOpen}
        onClose={closeModal}
        programId={selectedProgram?.id}
        programName={selectedProgram?.name}
      />
    </div>
  );
};

export default CustomerLeadModalExample; 