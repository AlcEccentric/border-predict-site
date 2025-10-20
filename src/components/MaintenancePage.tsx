import React from 'react';

interface MaintenancePageProps {
    endTime?: string;
}

const MaintenancePage: React.FC<MaintenancePageProps> = ({ endTime }) => {
    return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-base-100">
            <div className="bg-base-200 rounded-lg shadow-lg p-8 max-w-md text-center">
                <div className="mb-6">
                    <div className="text-6xl mb-4">🔧</div>
                    <h1 className="text-2xl font-bold mb-2">メンテナンス中</h1>
                    <p className="text-base-content/70">
                        現在、システムメンテナンスを実施しております。
                    </p>
                </div>
                
                {endTime && (
                    <div className="bg-base-300 rounded-lg p-4">
                        <p className="text-sm text-base-content/60 mb-1">メンテナンス終了予定</p>
                        <p className="font-mono text-lg">{endTime}</p>
                    </div>
                )}
                
                <p className="text-sm text-base-content/50 mt-4">
                    ご不便をおかけして申し訳ございません。
                </p>
            </div>
        </div>
    );
};

export default MaintenancePage;