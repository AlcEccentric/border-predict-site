import React from 'react';
import { PredictionData } from '../types';

interface NeighborLinksProps {
    data: PredictionData;
}

const NeighborLinks: React.FC<NeighborLinksProps> = ({ data }) => {
    return (
        <div className="mt-4">
            <h3 className="text-xl font-bold mb-2">近傍イベント情報</h3>
            <div className="overflow-x-auto">
                <table className="table">
                    <thead>
                        <tr>
                            <th>近傍</th>
                            <th>イベント名</th>
                            <th>リンク</th>
                        </tr>
                    </thead>
                    <tbody>
                        {Object.entries(data.metadata.normalized.neighbors).map(([key, neighbor]) => (
                            <tr key={key}>
                                <td>近傍{key}</td>
                                <td>{neighbor.name}</td>
                                <td>
                                    <a
                                        href={`https://mltd.matsurihi.me/events/${neighbor.id}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="link link-primary"
                                    >
                                        詳細を見る
                                    </a>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default NeighborLinks;