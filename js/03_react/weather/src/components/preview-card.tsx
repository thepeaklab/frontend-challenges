import React from "react";

interface PreviewCardProps {
    degree: number;
    time: string;
    status?: string;
}

export const PreviewCard: React.FC<PreviewCardProps> = ({degree, time, status = ""}) => {
    return (
        <div className={"previewCard"}>
            <span className={"time"}>{time}</span>
            <span className={"degreePreview"}>{degree}°</span>
            <span className={"statusPreview"}>{status}</span>
        </div>)
}