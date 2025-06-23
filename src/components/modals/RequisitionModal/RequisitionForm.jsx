import React from 'react';
import { Building } from 'lucide-react';

const RequisitionForm = ({ formData, handleChange, departments, workflows }) => {
  // Ensure all arrays are properly initialized
  const departmentsArray = Array.isArray(departments) ? departments : [];
  const workflowsArray = Array.isArray(workflows) ? workflows : [];

  return (
    <div className="bg-gray-50 rounded-lg p-4">
      <h3 className="text-lg font-medium text-gray-900 mb-4">Basic Information</h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Title *
          </label>
          <input
            type="text"
            name="title"
            required
            className="form-input"
            value={formData.title}
            onChange={handleChange}
            placeholder="Enter requisition title"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            <Building className="h-4 w-4 inline mr-1" />
            Department
          </label>
          <select
            name="department"
            className="form-select"
            value={formData.department}
            onChange={handleChange}
          >
            <option value="">Select Department</option>
            {departmentsArray.map(dept => (
              <option key={dept.id} value={dept.name}>
                {dept.name}
              </option>
            ))}
          </select>
          <p className="text-xs text-gray-500 mt-1">
            Select the requesting department ({departmentsArray.length} available)
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Priority *
          </label>
          <select
            name="priority"
            required
            className="form-select"
            value={formData.priority}
            onChange={handleChange}
          >
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
            <option value="urgent">Urgent</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Required Date
          </label>
          <input
            type="date"
            name="required_date"
            className="form-input"
            value={formData.required_date}
            onChange={handleChange}
            min={new Date().toISOString().split('T')[0]}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Approval Workflow
          </label>
          <select
            name="workflow_id"
            className="form-select"
            value={formData.workflow_id}
            onChange={handleChange}
          >
            {workflowsArray.map(workflow => (
              <option key={workflow.id} value={workflow.id}>
                {workflow.name}
              </option>
            ))}
          </select>
        </div>

        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Description
          </label>
          <textarea
            name="description"
            rows="3"
            className="form-input"
            value={formData.description}
            onChange={handleChange}
            placeholder="Enter requisition description"
          />
        </div>

        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Justification
          </label>
          <textarea
            name="justification"
            rows="3"
            className="form-input"
            value={formData.justification}
            onChange={handleChange}
            placeholder="Explain why this requisition is needed"
          />
        </div>
      </div>
    </div>
  );
};

export default RequisitionForm;