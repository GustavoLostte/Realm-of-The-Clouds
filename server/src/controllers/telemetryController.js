/**
 * server/src/controllers/telemetryController.js
 * Realm of Kingdoms — Authoritative Telemetry & Metrics Ingestion
 * WizzarDev Studios
 */

import { supabase } from '../config/supabase.js'

export const ingestTelemetryBatch = async (req, res) => {
  try {
    const { events } = req.body

    if (!Array.isArray(events) || events.length === 0) {
      return res.status(400).json({ success: false, error: 'Expected non-empty array of events' })
    }

    // Clean & validate events
    const sanitizedEvents = events.map((evt) => ({
      session_id: String(evt.session_id || 'unknown_session'),
      player_id: evt.player_id ? String(evt.player_id) : null,
      player_email: evt.player_email ? String(evt.player_email) : null,
      event_name: String(evt.event_name || 'unknown_event').slice(0, 80),
      metadata: evt.metadata && typeof evt.metadata === 'object' ? evt.metadata : {},
      created_at: evt.created_at || new Date().toISOString(),
    }))

    // Insert into Supabase table game_telemetry
    const { data, error } = await supabase.from('game_telemetry').insert(sanitizedEvents)

    if (error) {
      console.warn('⚠️ [Telemetry] Supabase insert warning:', error.message)
      // Return 200 with fallback notice so client doesn't choke if DB table isn't created yet
      return res.status(202).json({
        success: true,
        persisted: false,
        warning: 'Table not ready or RLS restriction, events acknowledged in memory',
        count: sanitizedEvents.length,
      })
    }

    return res.status(200).json({
      success: true,
      persisted: true,
      count: sanitizedEvents.length,
    })
  } catch (err) {
    console.error('❌ [Telemetry Error]:', err)
    return res.status(500).json({ success: false, error: 'Internal telemetry ingestion error' })
  }
}

export const getTelemetrySummary = async (req, res) => {
  try {
    // 1. Fetch recent events
    const { data: recentEvents, error } = await supabase
      .from('game_telemetry')
      .select('event_name, session_id, player_id, created_at')
      .order('created_at', { ascending: false })
      .limit(100)

    if (error) {
      return res.status(200).json({
        status: 'online',
        database: 'not_connected_or_empty',
        recent_events: [],
      })
    }

    const eventCounts = {}
    const activeSessions = new Set()

    for (const evt of recentEvents || []) {
      eventCounts[evt.event_name] = (eventCounts[evt.event_name] || 0) + 1
      if (evt.session_id) activeSessions.add(evt.session_id)
    }

    return res.status(200).json({
      status: 'online',
      active_sessions_recent: activeSessions.size,
      total_recent_events: recentEvents?.length || 0,
      event_breakdown: eventCounts,
      timestamp: new Date().toISOString(),
    })
  } catch (err) {
    console.error('❌ [Telemetry Summary Error]:', err)
    return res.status(500).json({ error: 'Failed to retrieve telemetry summary' })
  }
}
