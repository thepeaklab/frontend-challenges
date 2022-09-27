import React from "react";

interface MainHeadlineProps {
}

export const MainHeadline:React.FC<MainHeadlineProps> = () => {
    return (
        <header className="header" id="header">
            <img className="icon" id="weatherIcon" alt="weatherIcon"/>
            <h1 className="headline">Wetter</h1>
        </header>
    )
}