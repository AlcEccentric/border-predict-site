// components/CardContainer.tsx
import React from 'react';

interface CardContainerProps {
    children: React.ReactNode;
    className?: string;
}

const CardContainer: React.FC<CardContainerProps> = ({ children, className = '' }) => {
    return (
        <div className={`bg-base-200 rounded-xl p-6 shadow-lg ${className}`}>
            {children}
        </div>
    );
};

export default CardContainer;