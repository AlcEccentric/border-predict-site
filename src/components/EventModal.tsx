import React from 'react';

const EventModal: React.FC = () => {
    return (
        <div className="flex flex-col items-center justify-center min-h-screen space-y-4">
            {/* Mizuki */}
            <div className="chat chat-start max-w-lg">
                <div className="chat-bubble" style={{ backgroundColor: '#c8dcee', color: '#1f2937' }}>
                ……どうやら、いまはイベントが開催されていないようです。  
                それか……まだ対応していないのかもしれませんね。 
                </div>
            </div>

            {/* Haruka */}
            <div className="chat chat-end max-w-lg">
                <div className="chat-bubble" style={{ backgroundColor: '#f79a9c', color: 'white' }}>
                    そっか〜。じゃあ、次を楽しみにしよっ♪
                    始まったら、また一緒にがんばろうねっ！
                </div>
            </div>
        </div>


    );
};

export default EventModal;