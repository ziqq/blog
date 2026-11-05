---
title: What happens between frames
description: A short look at how the browser prepares and displays a frame.
date: 2026-10-14
demo: true
---
Between a page change and the result appearing on screen, the browser calculates styles, lays out elements, and prepares the image.

## Measure first

When an animation looks uneven, record a profile in the developer tools. It helps show where time is being spent.

## Avoid unnecessary work

Alternating between reading element sizes and updating styles can force repeated calculations. Group reads and writes where possible.

Optimization starts with a concrete observation and ends with another measurement.
