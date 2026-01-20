import React, { useEffect } from 'react';
import {Heading} from "@entur/typography/beta";
import {Contrast} from "@entur/layout";
import ServiceAlert from './components/ServiceAlert';
import {semantic} from "@entur/tokens";

function App() {
    useEffect(() => {
        const interval = setInterval(() => {
            window.location.reload();
        }, 300000); // 5 minutes
        return () => clearInterval(interval);
    }, []);

    return (
        <div className="app" style={{ minHeight: '100vh', minWidth: '100vw', width: '100vw', height: '100vh', boxSizing: 'border-box', margin: 0, padding: 0, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>

            <Contrast style={{width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: semantic.fill.background.contrast.light, flex: '0 0 auto' }}>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
                    <img src={"/logo.svg"} alt="Staff" style={{ height: '300',  width: 'auto', objectFit: 'contain', display: 'block' }} />
                    <Heading as="h1" variant="title-1">Driftstatus</Heading>
                    <img src={"/sheep.svg"} alt="Staff" style={{ maxHeight: '90%', maxWidth: '90%', width: 'auto', height: 'auto', objectFit: 'contain', display: 'block' }} />
                </div>
            </Contrast>
            <div style={{ flex: '1 1 0%', minHeight: 0, display: 'flex' }}>
                <ServiceAlert />
            </div>
        </div>
    );
}

export default App;
