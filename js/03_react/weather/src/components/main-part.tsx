import React from "react";
import {MainHeadline} from "./main-headline";
import {MainPreview} from "./main-preview";
import {PreviewCard} from "./preview-card";

interface MainPartProps {

}

export const MainPart: React.FC<MainPartProps> = () => {
    return (
        <div className={"wrapper"}>
            <MainHeadline/>
            <MainPreview degree={12} status={"Bewölkt"}/>
            <PreviewCard degree={12} time={"12"}/>
        </div>
    )
}