import React from "react";

interface MainPreviewProps {
    degree: number;
    status: string;
}
export const MainPreview: React.FC<MainPreviewProps> = ({degree, status}) => {
    return (
        <div className={"weather_now"}>
            <div className={"degree"}>{degree}°</div>
            <div className={"status"}>{status}°</div>
        </div>
    )
}