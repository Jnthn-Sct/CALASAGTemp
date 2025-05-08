import React from 'react';

const Report: React.FC = () => {
    return (
        <div className="min-h-screen bg-[#f8eed4] p-4">
            <h1 className="text-2xl font-bold text-[#005524] mb-4">Report an Emergency</h1>
            <div className="bg-white rounded-lg shadow-md p-4">
                <form className="space-y-4">
                    <div>
                        <label className="block text-gray-700 font-medium mb-2">Emergency Type</label>
                        <select className="w-full p-2 border border-gray-300 rounded-lg">
                            <option>Medical Emergency</option>
                            <option>Fire</option>
                            <option>Accident</option>
                            <option>Crime</option>
                            <option>Other</option>
                        </select>
                    </div>
                    <div>
                        <label className="block text-gray-700 font-medium mb-2">Description</label>
                        <textarea
                            className="w-full p-2 border border-gray-300 rounded-lg"
                            rows={4}
                            placeholder="Describe the emergency situation..."
                        />
                    </div>
                    <div>
                        <label className="block text-gray-700 font-medium mb-2">Location</label>
                        <input
                            type="text"
                            className="w-full p-2 border border-gray-300 rounded-lg"
                            placeholder="Enter your location"
                        />
                    </div>
                    <button
                        type="submit"
                        className="w-full bg-[#005524] text-white py-2 px-4 rounded-lg hover:bg-[#004015] transition-colors"
                    >
                        Submit Report
                    </button>
                </form>
            </div>
        </div>
    );
};

export default Report; 