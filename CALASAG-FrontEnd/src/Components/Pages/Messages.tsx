import React from 'react';

const Messages: React.FC = () => {
    return (
        <div className="min-h-screen bg-[#f8eed4] p-4">
            <h1 className="text-2xl font-bold text-[#005524] mb-4">Messages</h1>
            <div className="bg-white rounded-lg shadow-md p-4">
                <p className="text-gray-600">Your messages will appear here.</p>
            </div>
        </div>
    );
};

export default Messages; 