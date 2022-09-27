import React from 'react';
import './App.css';
import {PreviewCard} from "./components/preview-card";
import {MainPreview} from "./components/main-preview";
import {MainPart} from "./components/main-part";

function App() {
    return (
        <div className="App">
            <MainPart />
            <PreviewCard degree={12} time={"23"} status={"leicht bewölkt"}/>
        </div>
    );
}

export default App;
