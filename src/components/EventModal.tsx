import React from 'react';

const EventModal: React.FC = () => {
    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
            <div className="bg-white p-8 rounded-lg shadow-xl max-w-md text-center">
                <h2 className="text-2xl mb-4">イベント未開催 (｡•́︿•̀｡)</h2>
                <p className="text-gray-600">
                    現在進行中のイベントはありません。(´･ω･｀)
                </p>
            </div>
        </div>
    );
};

export default EventModal;