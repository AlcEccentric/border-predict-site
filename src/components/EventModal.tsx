import React from 'react';

const EventModal: React.FC = () => {
    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
            <div className="bg-white p-8 rounded-lg shadow-xl max-w-2xl w-full text-center">
                <p className="text-gray-800">
                    プロデューサー、いまは、開催中のイベントがないようです……
                </p>
                <p className="text-gray-800">
                    少々、静かすぎる気もしますが……それも、悪くありません。
                </p>
            </div>
        </div>
    );
};

export default EventModal;