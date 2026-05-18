# TatkalCopilot PRD
## Human-Assisted IRCTC Tatkal Booking Accelerator

Version: 1.0  
Author: Sai  
Platform: Desktop (Electron + Playwright)  
Primary Goal: Reduce Tatkal booking interaction time from ~2-5 minutes to under 20 seconds.

---

# 1. Vision

TatkalCopilot is a human-assisted desktop automation tool designed to streamline and accelerate IRCTC Tatkal bookings while keeping the user in control of captcha solving and payment authorization.

The product eliminates repetitive manual steps:
- searching trains
- selecting coach
- entering passenger details
- selecting payment methods
- navigating slow UI flows

The system prepares the entire booking pipeline before Tatkal opens and executes all non-human actions instantly at booking time.

---

# 2. Problem Statement

Current Tatkal booking flow is:
- stressful
- time-sensitive
- highly repetitive
- vulnerable to delays

Users often lose tickets due to:
- slow typing
- UI lag
- delayed payment navigation
- session expiry
- human reaction time

TatkalCopilot solves this by reducing the booking process to:
1. Solve captcha
2. Approve payment

Everything else is automated.

---

# 3. Product Goals

## Primary Goals
- Reduce booking latency
- Improve Tatkal success rate
- Eliminate repetitive form filling
- Maintain persistent IRCTC sessions
- Provide exact-time execution

## Secondary Goals
- Retry failed bookings intelligently
- Suggest alternative trains automatically
- Reduce user anxiety during booking

---

# 4. Non-Goals

TatkalCopilot will NOT:
- bypass captchas automatically
- automate OTP interception
- mass-book tickets
- violate IRCTC payment authentication
- perform hidden background bookings
- support ticket scalping operations

The user remains actively involved in:
- captcha solving
- payment approval
- OTP verification if required

---

# 5. User Personas

## Primary Persona
### Student / Working Professional
- books Tatkal frequently
- struggles with timing pressure
- wants faster booking
- uses desktop/laptop during booking

## Secondary Persona
### Family Travel Planner
- repeatedly fills same passenger details
- books for multiple people
- wants reliable execution

---

# 6. Core User Flow

---

## Pre-Booking Phase

### T-10 minutes
System launches automatically.

Actions:
- Opens IRCTC
- Restores session
- Verifies login state
- Loads train search page
- Preloads saved journey

---

## T-1 minute
System enters "armed state".

Actions:
- Locks selected train
- Prepares automation pipeline
- Starts precision clock sync
- Disables unnecessary animations
- Begins DOM observers

---

## T=11:00:00

System instantly:
1. Refreshes availability
2. Selects Tatkal quota
3. Selects SL class
4. Clicks Book
5. Fills passenger forms
6. Fills berth preferences
7. Selects payment method
8. Stops at captcha

---

## Captcha Stage

User:
- solves captcha manually

System:
- auto-focuses captcha field
- enlarges captcha area
- instantly resumes after submission

---

## Payment Stage

System:
- auto-selects preferred payment option
- skips unnecessary steps
- opens UPI intent/payment page

User:
- approves payment

---

## Success Stage

System:
- captures PNR
- saves ticket PDF
- sends desktop notification
- logs booking statistics

---

# 7. Key Features

---

## 7.1 Persistent Login Sessions

### Description
Store encrypted IRCTC session data locally.

### Benefits
- no repeated login
- no last-minute session panic
- reduced booking latency

### Technical Notes
- encrypted cookie storage
- session validity checker
- auto-refresh logic

---

## 7.2 Journey Profiles

### Description
Users save:
- source station
- destination
- travel date
- train number
- quota
- preferred class

### Benefits
One-click loading for future bookings.

---

## 7.3 Passenger Vault

### Description
Secure local storage of:
- names
- ages
- gender
- berth preference
- IDs

### Security
- AES encryption
- local-only storage
- no cloud sync initially

---

## 7.4 Exact Time Synchronization

### Description
System synchronizes local clock with NTP servers.

### Importance
Tatkal success often depends on sub-second execution timing.

### Features
- latency estimation
- clock drift correction
- live sync status

---

## 7.5 Smart DOM Automation

### Description
Automation engine optimized for:
- minimal clicks
- zero animations
- direct element targeting

### Technical Approach
- Playwright locators
- DOM mutation observers
- precomputed selectors

---

## 7.6 Captcha Assist

### Description
Human-assisted captcha flow.

### Features
- automatic cursor focus
- enlarged captcha window
- keyboard-first navigation

---

## 7.7 Payment Fast Lane

### Description
Optimized payment selection pipeline.

### Supported Methods
- UPI
- IRCTC wallet
- cards

### Features
- auto-selection
- preferred payment ranking
- redirect skipping

---

## 7.8 Retry Engine

### Description
Automatically retries failed booking attempts.

### Retry Cases
- session timeout
- payment failure
- booking rejection
- stale availability

### Retry Logic
- exponential cooldown
- alternative train fallback
- alternate class fallback

---

## 7.9 Smart Train Ranking

### Description
Suggests trains with higher Tatkal success probability.

### Inputs
- historical availability
- booking load
- waitlist patterns
- time-to-fill estimates

---

# 8. Advanced Features (Future)

---

## 8.1 AI Booking Predictor
Predict:
- which train has best success chance
- optimal booking order
- best payment method

---

## 8.2 Multi-Train Strategy
Simultaneously prepare:
- primary train
- fallback train
- alternate class

---

## 8.3 Desktop Notifications
- booking reminders
- session expiry alerts
- payment alerts

---

## 8.4 Voice Alerts
Examples:
- "Captcha required"
- "Payment pending"
- "Booking successful"

---

# 9. Technical Architecture

---

# Frontend
Electron Desktop App

## Responsibilities
- UI
- local storage
- notifications
- orchestration

---

# Automation Layer
Playwright

## Responsibilities
- browser automation
- DOM actions
- session persistence

---

# 9.1 Optional Stealth Browser Layer

## Description
TatkalCopilot may optionally support hardened Chromium builds for improved automation stability and reduced browser fingerprint inconsistencies.

## Supported Browsers
- Chromium
- Playwright Chromium
- CloakBrowser (optional experimental mode)

## Purpose
The stealth layer is NOT intended for:
- captcha bypassing
- mass automation
- abuse evasion

Its purpose is:
- reducing false automation flags
- improving session consistency
- stabilizing browser fingerprints
- preventing unnecessary session invalidation

## Technical Notes
The browser abstraction layer should allow interchangeable browser engines via adapters.

Example:
- Standard Chromium Adapter
- Hardened Chromium Adapter
- CloakBrowser Adapter

## Risks
Using stealth browsers may:
- increase maintenance complexity
- trigger stricter anti-bot scrutiny
- create legal/compliance concerns
- break after browser updates

## Recommendation
MVP should use:
- standard Playwright Chromium

Stealth browser support should remain:
- optional
- experimental
- disabled by default

---

# Local Database
SQLite

## Stores
- passengers
- journeys
- logs
- settings

---

# Security Layer

## Features
- AES encryption
- secure credential vault
- local-only sensitive storage

---

# Timing Engine

## Features
- NTP synchronization
- latency compensation
- execution scheduler

---

# 10. Suggested Tech Stack

| Layer | Technology |
|---|---|
| Desktop App | Electron |
| Automation | Playwright |
| Local DB | SQLite |
| Backend Logic | Node.js |
| UI | React + Tailwind |
| Encryption | Node Crypto |
| Packaging | Electron Builder |

---

# 11. Performance Requirements

| Metric | Target |
|---|---|
| Form Fill Time | < 1 second |
| Train Selection | < 500ms |
| Session Restore | < 2 seconds |
| Booking Trigger Delay | < 100ms |
| App Launch Time | < 5 seconds |

---

# 12. Security Requirements

---

## Must Have
- encrypted passenger data
- encrypted session storage
- no cloud credential storage
- secure local vault

---

## Must NOT
- store banking passwords
- intercept OTPs
- bypass payment authentication

---

# 13. UI/UX Principles

---

## Design Goals
- minimal clicks
- low cognitive load
- keyboard-first
- high visibility under stress

---

## Visual Style
- dark mode default
- large countdown timer
- real-time status indicators
- distraction-free layout

---

# 14. Failure Handling

---

## Booking Failure
System:
- retries automatically
- proposes alternate trains
- alerts user instantly

---

## Session Expiry
System:
- requests relogin
- preserves booking state

---

## IRCTC Downtime
System:
- pauses automation
- resumes intelligently

---

# 15. Legal & Compliance Position

TatkalCopilot is designed as:
- a personal productivity assistant
- not a bulk-booking platform
- not a captcha bypass system

The user remains responsible for:
- captcha solving
- payment authorization
- IRCTC account usage

---

# 16. MVP Scope

---

## Included
- session persistence
- train auto-selection
- passenger autofill
- captcha pause
- payment auto-navigation
- desktop app UI

---

## Excluded
- AI prediction
- multi-session orchestration
- cloud sync
- mobile app
- captcha solving

---

# 17. Future Expansion

- mobile companion app
- analytics dashboard
- booking history insights
- smart travel recommendations
- train demand prediction

---

# 18. Success Metrics

| Metric | Goal |
|---|---|
| Successful Booking Rate | +40% improvement |
| Average User Interaction Time | < 10 seconds |
| Retry Success Rate | > 25% |
| Session Failure Rate | < 5% |

---

# 19. Risks

| Risk | Severity |
|---|---|
| IRCTC frontend changes | High |
| Session invalidation | High |
| Automation detection | Medium |
| Payment gateway failures | High |
| Timing inaccuracies | Medium |

---

# 20. Final Product Philosophy

TatkalCopilot is not a bot.

It is a high-speed human booking copilot designed to remove friction, reduce stress, and optimize execution during the narrow booking window of Tatkal reservations.

The human remains in control.
The machine removes the chaos.

Or at least tries to. IRCTC still operates like a distributed systems stress test wrapped inside a government portal from three geological eras ago.
