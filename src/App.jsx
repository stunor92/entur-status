import React, { useState, useEffect } from 'react';
import {Heading} from "@entur/typography/beta";
import {Contrast} from "@entur/layout";
import ServiceAlert from './components/ServiceAlert';

function App() {
    // Hardcoded location for Bergen
    const LOCATION = { name: 'Bergen', lat: 60.39299, lng: 5.32415 };
    const [randomStaffImage, setRandomStaffImage] = useState(null);

    // Staff image logic
    useEffect(() => {
        const staffImages = ['/staff_woman.svg', '/staff_man.svg'];
        const randomImage = staffImages[Math.floor(Math.random() * staffImages.length)];
        setRandomStaffImage(randomImage);
    }, []);

    return (
        <div className="app" style={{ minHeight: '100vh', minWidth: '100vw', width: '100vw', height: '100vh', boxSizing: 'border-box', margin: 0, padding: 0, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>

            <Contrast style={{ flex: 1, width: '100vw', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#181C56' }}>
                <div>
                    <img src={"/logo.svg"} alt="Staff" style={{ maxHeight: '90%', maxWidth: '90%', width: 'auto', height: 'auto', objectFit: 'contain', display: 'block' }} />

                    <Heading as="h1" variant="title-1">Velkommen til Entur Bergen</Heading>
                    <Heading as="h2" variant="title-2">Vi ønsker deg en fin dag på kontoret!</Heading>
                </div>
            </Contrast>
            <ServiceAlert />
        </div>
    );
}

export default App;
