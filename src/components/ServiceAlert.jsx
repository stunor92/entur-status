import React, { useState, useEffect } from 'react';
import {GridContainer, GridItem} from "@entur/grid";
import {CalendarIcon, WarningIcon} from "@entur/icons";
import {Heading, Text, UnorderedList, ListItem} from "@entur/typography/beta";
import {base, semantic} from '@entur/tokens'

function categorizeAlerts(items) {
    const now = new Date();
    const todayStr = now.toISOString().slice(0, 10);
    const ongoing = [];
    const scheduled = [];
    items.forEach(item => {
        const pubDateStr = item.querySelector('pubDate')?.textContent;
        const pubDate = pubDateStr ? new Date(pubDateStr) : null;
        const endDateStr = item.querySelector('maintenanceEndDate')?.textContent;
        const endDate = endDateStr ? new Date(endDateStr) : null;
        // Ongoing: now is between pubDate and maintenanceEndDate, or pubDate is today and no endDate
        if (
            (pubDate && endDate && now >= pubDate && now <= endDate) ||
            (pubDate && !endDate && pubDate.toISOString().slice(0, 10) === todayStr)
        ) {
            ongoing.push(item);
        } else if (
            pubDate && endDate && now < pubDate && now < endDate
        ) {
            scheduled.push(item);
        }
    });
    return { ongoing, scheduled };
}

export default function ServiceAlert() {
    const [ongoingAlerts, setOngoingAlerts] = useState([]);
    const [scheduledAlerts, setScheduledAlerts] = useState([]);
    const [ongoingCurrent, setOngoingCurrent] = useState(0);
    const [scheduledCurrent, setScheduledCurrent] = useState(0);

    useEffect(() => {
        async function fetchEnturStatus() {
            try {
                const response = await fetch('https://status.entur.org/history.rss');
                const text = await response.text();
                const parser = new window.DOMParser();
                const xml = parser.parseFromString(text, 'application/xml');
                const items = Array.from(xml.querySelectorAll('item'));
                const { ongoing, scheduled } = categorizeAlerts(items);
                const mapAlert = item => ({
                    title: item.querySelector('title')?.textContent || '',
                    pubDate: item.querySelector('pubDate')?.textContent || '',
                    description: item.querySelector('description')?.textContent || ''
                });
                setOngoingAlerts(ongoing.slice(0, 3).map(mapAlert));
                setScheduledAlerts(scheduled.slice(0, 3).map(mapAlert));
            } catch (e) {
                setOngoingAlerts([]);
                setScheduledAlerts([]);
            }
        }
        fetchEnturStatus();
        const interval = setInterval(fetchEnturStatus, 10 * 60 * 1000); // Check every 10 minutes
        return () => clearInterval(interval);
    }, []);

    // Carousel logic for ongoing
    useEffect(() => {
        if (ongoingAlerts.length > 1) {
            const carouselInterval = setInterval(() => {
                setOngoingCurrent((prev) => (prev + 1) % ongoingAlerts.length);
            }, 30000);
            return () => clearInterval(carouselInterval);
        }
    }, [ongoingAlerts]);
    // Carousel logic for scheduled
    useEffect(() => {
        if (scheduledAlerts.length > 1) {
            const carouselInterval = setInterval(() => {
                setScheduledCurrent((prev) => (prev + 1) % scheduledAlerts.length);
            }, 30000);
            return () => clearInterval(carouselInterval);
        }
    }, [scheduledAlerts]);

    // Helper: Parse <description> as multiple events (split by <br> or <br/> or <br />)
    function parseDescriptionEvents(html) {
        let safeHtml = html.replace(/<(?!\/?(b|strong|i|em|a|br)(\s|>|$))[^>]+>/gi, '')
            .replace(/<a ([^>]+)>/gi, '<a $1 target="_blank" rel="noopener noreferrer">');
        return safeHtml.split(/<br\s*\/?>(?:\s*)/i).map(line => line.trim()).filter(Boolean);
    }

    function AlertSection({heading, alerts, current, color, emptyText, iconType }) {
        const alert = alerts[current] || { title: '', pubDate: '', description: '' };
        return (
            <div style={{ background: color, padding: '30px', height: '100%', width: '100%', boxSizing: 'border-box', position: 'relative', display: 'flex', flexDirection: 'column', justifyContent: 'center', flex: 1, minHeight: 0 }}>
                <GridContainer style={{ height: '100%', width: '70%', alignItems: 'flex-start', justifyContent: 'flex-start' }}>
                    <GridItem small={2} medium={2} large={2}>
                        {iconType === 'calendar' && (
                            <CalendarIcon size={50} color={base.light.baseColors.frame.contrast}/>
                        )}
                        {iconType === 'warning' && (
                            <WarningIcon size={50} color={base.light.baseColors.frame.contrast}/>
                        )}
                    </GridItem>
                    <GridItem small={10} medium={10} large={10}>
                        <div>
                            <Heading as="h2" variant="title-2">{heading}</Heading>
                            {alerts.length === 0 ? (
                                <Heading as="h3" variant="subtitle-1">{emptyText}</Heading>
                            ) : (
                                <div>
                                    <Heading as="h3" variant="subtitle-1">{alert.title}</Heading>
                                    <Text variant="caption" spacing="sm">{alert.pubDate}</Text>
                                    <UnorderedList>
                                        {parseDescriptionEvents(alert.description).map((line, idx) => {
                                            const match = line.match(/^([A-Z][a-z]{2} \d{1,2}, \d{2}:\d{2} [A-Z]{3})\s+([A-Za-zæøåÆØÅ ]+?)\s*-\s*(.*)$/);
                                            let title, message;
                                            if (match) {
                                                title = match[1] + ' ' + match[2];
                                                message = match[3];
                                            } else {
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
                                </div>
                            )}
                        </div>
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

    // Layout: stack vertically, each section fills half if both exist, or all if only one
    const bothSections = ongoingAlerts.length > 0 && scheduledAlerts.length > 0;
    return (
        <div style={{ display: 'flex', flexDirection: 'column', height: '100%', width: '100%' }}>
            <div style={{ flex: bothSections ? 1 : 2, minHeight: 0 }}>
                <AlertSection
                    heading="Pågående hendelser"
                    alerts={ongoingAlerts}
                    current={ongoingCurrent}
                    color={ongoingAlerts.length === 0 ? semantic.fill.success.tint : semantic.fill.negative.tint}
                    emptyText="Ingen pågående driftshendelser"
                    iconType="warning"
                />
            </div>
            <div style={{ flex: bothSections ? 1 : 2, minHeight: 0 }}>
                <AlertSection
                    heading="Planlagt vedlikehold"
                    alerts={scheduledAlerts}
                    current={scheduledCurrent}
                    color={scheduledAlerts.length === 0 ? semantic.fill.success.tint : semantic.fill.warning.tint}
                    emptyText="Ingen planlagt vedlikedhold"
                    iconType="calendar"
                />
            </div>
        </div>
    );
}
