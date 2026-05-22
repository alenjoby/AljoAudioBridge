# Aljo Audio Bridge

A lightweight Windows desktop utility designed for real-time audio routing and replication across multiple playback endpoints simultaneously.

[![OS](https://img.shields.io/badge/OS-Windows%2010%20%2F%2011-blue.svg?style=flat-square)](#)
[![License](https://img.shields.io/badge/License-MIT-yellow.svg?style=flat-square)](#)

---

## Overview

Windows natively restricts audio playback to a single active device. Aljo Audio Bridge solves this by allowing you to mirror your system audio to multiple target devices in real-time. It is ideal for shared listening experiences, such as connecting two Bluetooth headsets or mixing wired headphones with wireless speakers, keeping all playback in perfect synchronization.

---

## Key Features

* **Simultaneous Audio Mirroring**: Route your desktop audio to multiple connected playback devices at the same time.
* **Format Compatibility**: Automatically handles stream configurations to ensure smooth audio output without distortion.
* **Low System Resource Usage**: Runs as a lightweight background application with minimal memory and CPU consumption.
* **Individual Volume Adjustment**: Manage the output volume of each target device independently.
* **Global System Shortcuts**: Control master volume and mute state globally using system-wide hotkeys, even while in fullscreen applications.
* **Seamless Device Management**: Automatically lists active audio endpoints and handles device connection updates dynamically.

---

## System Requirements

* **Operating System**: Windows 10 or Windows 11 (64-bit)
* **Audio Devices**: Multiple active playback endpoints (Wired, Bluetooth, HDMI, or USB)

---

## Getting Started

### Installation

#### Option 1: Command Line (Windows Package Manager)
Install directly using `winget`:
```bash
winget install Aljo.AudioBridge
```

#### Option 2: Binary Installer
1. Download the [AljoAudioBridgeSetup.exe](./website/AljoAudioBridgeSetup.exe) installer.
2. Run the installer wizard and follow the prompts.

#### Option 3: Portable Executable
Download the standalone [AljoAudioBridge.exe](./website/AljoAudioBridge.exe) and run it directly.

---

## Global Keyboard Shortcuts

Control volume and mute states globally, even when in fullscreen applications:

| Action | Shortcut Key | Description |
| :--- | :--- | :--- |
| **Increase Volume** | `Ctrl + Alt + Up` | Increases volume on active routed endpoints by 5% |
| **Decrease Volume** | `Ctrl + Alt + Down` | Decreases volume on active routed endpoints by 5% |
| **Master Mute** | `Ctrl + Alt + M` | Globally mutes/unmutes the audio routing bridge |

---

## License

This project is licensed under the MIT License. See [LICENSE](#) for details.
