import React, { useState, useEffect } from 'react';
import {GridContainer, GridItem} from "@entur/grid";
import {WarningIcon} from "@entur/icons";
import {Heading, Text, UnorderedList, ListItem} from "@entur/typography/beta";

export default function ServiceAlert() {
    const [alerts, setAlerts] = useState([]);
    const [current, setCurrent] = useState(0);

    useEffect(() => {
        async function fetchEnturStatus() {
            try {
                const response = await fetch('https://status.entur.org/history.rss');
                const text = await response.text();
                const parser = new window.DOMParser();
                const xml = parser.parseFromString(text, 'application/xml');
                const items = Array.from(xml.querySelectorAll('item'));
                // Only show alerts for today or those between <pubDate> and <maintenanceEndDate>
                const now = new Date();
                const todayStr = now.toISOString().slice(0, 10);
                const filteredAlerts = items.filter(item => {
                    const pubDateStr = item.querySelector('pubDate')?.textContent;
                    const pubDate = pubDateStr ? new Date(pubDateStr) : null;
                    const endDateStr = item.querySelector('maintenanceEndDate')?.textContent;
                    const endDate = endDateStr ? new Date(endDateStr) : null;
                    // Ongoing: now is between pubDate and maintenanceEndDate
                    if (pubDate && endDate && now >= pubDate && now <= endDate) {
                        return true;
                    }
                    // Planned: now is before pubDate and maintenanceEndDate exists
                    if (pubDate && endDate && now < pubDate && now < endDate) {
                        return true;
                    }
                    // Show if pubDate is today
                    if (pubDate && pubDate.toISOString().slice(0, 10) === todayStr) {
                        return true;
                    }
                    return false;
                });
                const latestAlerts = filteredAlerts.slice(0, 3).map(item => ({
                    title: item.querySelector('title')?.textContent || '',
                    pubDate: item.querySelector('pubDate')?.textContent || '',
                    description: item.querySelector('description')?.textContent || ''
                }));
                setAlerts(latestAlerts);
            } catch (e) {
                setAlerts([]);
            }
        }
        fetchEnturStatus();
        const interval = setInterval(fetchEnturStatus, 10 * 60 * 1000); // Check every 10 minutes
        return () => clearInterval(interval);
    }, []);

    // Carousel logic
    useEffect(() => {
        if (alerts.length > 1) {
            const carouselInterval = setInterval(() => {
                setCurrent((prev) => (prev + 1) % alerts.length);
            }, 30000); // Change alert every 30 seconds
            return () => clearInterval(carouselInterval);
        }
    }, [alerts]);

    if (alerts.length === 0) return null;
    const alert = alerts[current] || { title: '', pubDate: '', description: '' };
    // Helper: Parse <description> as multiple events (split by <br> or <br/> or <br />)
    function parseDescriptionEvents(html) {
        // Remove unwanted tags, keep <b>, <strong>, <i>, <em>, <a>, <br>
        let safeHtml = html.replace(/<(?!\/?(b|strong|i|em|a|br)(\s|>|$))[^>]+>/gi, '')
                            .replace(/<a ([^>]+)>/gi, '<a $1 target="_blank" rel="noopener noreferrer">');
        // Split on <br>, <br/>, <br />
        return safeHtml.split(/<br\s*\/?>(?:\s*)/i).map(line => line.trim()).filter(Boolean);
    }
    return (
        <div style={{ background: '#ff5959', padding: '30px', height: alerts.length > 0 ? '500px' : 'auto', width: '100vw', boxSizing: 'border-box' }}>
            <GridContainer spacing={"medium"} style={{ display: 'flex', height: '200px' }}>
                <GridItem small={2} medium={2} large={2}>
                    <WarningIcon size={50}/>
                </GridItem>
                <GridItem small={2} medium={2} large={2}>
                    <Heading as="h3" variant="subtitle-1" >Driftstatus</Heading>
                    <Heading as="h4" variant="section-1" >{alert.title || 'Ingen statusmelding'}</Heading>
                    <Text variant="caption" spacing="sm">{alert.pubDate}</Text>

                    {/* Use parsed events for formatted output as a list */}
                    <UnorderedList>
                        {parseDescriptionEvents(alert.description).map((line, idx) => {
                            // Match format: [Date][Type] - [Message]
                            // Example: Jan 16, 08:34 CET Resolved - Entur App og Entur Web fungerer nå som normalt igjen.
                            const match = line.match(/^([A-Z][a-z]{2} \d{1,2}, \d{2}:\d{2} [A-Z]{3})\s+([A-Za-zæøåÆØÅ ]+?)\s*-\s*(.*)$/);
                            let title, message;
                            if (match) {
                                title = match[1] + ' ' + match[2];
                                message = match[3];
                            } else {
                                // fallback: try to extract status keyword as title
                                const statusMatch = line.match(/^(Completed|In progress|Update|Scheduled|Resolved|Investigating)[:\-]?\s*/i);
                                if (statusMatch) {
                                    title = statusMatch[1];
                                    message = line.replace(statusMatch[0], '').trim();
                                } else {
                                    title = undefined;
                                    message = line;
                                }
                            }
                            return (
                                <ListItem key={idx} title={title}><span dangerouslySetInnerHTML={{ __html: message }} /></ListItem>
                            );
                        })}
                    </UnorderedList>
                </GridItem>
            </GridContainer>
            {alerts.length > 1 && (
                <div style={{ marginTop: '12px', fontWeight: 'normal', fontSize: '0.8rem', width: '100%', position: 'absolute', left: 0, right: 0, bottom: 24, display: 'flex', justifyContent: 'center', alignItems: 'center', pointerEvents: 'none' }}>
                    {alerts.map((_, idx) => (
                        <span key={idx} style={{ display: 'inline-block', width: 10, height: 10, borderRadius: '50%', background: idx === current ? 'white' : 'rgba(255,255,255,0.4)', margin: '0 4px' }} />
                    ))}
                </div>
            )}
        </div>
    );
}
