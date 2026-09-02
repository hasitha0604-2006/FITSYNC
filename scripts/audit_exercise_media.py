#!/usr/bin/env python3
import os
import sys
import json
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent.parent

def run_audit():
    print('=' * 60)
    print('FITSYNC AI - EXERCISE MEDIA AUDIT')
    print('=' * 60)

    json_path = BASE_DIR / 'data' / 'exercises.json'
    if not json_path.exists():
        print(f'[ERROR] exercises.json not found at {json_path}')
        return

    with open(json_path, 'r', encoding='utf-8') as f:
        exercises = json.load(f)

    manifest_path = BASE_DIR / 'data' / 'exercise_media.json'
    manifest = {}
    if manifest_path.exists():
        with open(manifest_path, 'r', encoding='utf-8') as f:
            manifest = json.load(f)

    total_exercises = len(exercises)
    available_videos = []
    missing_videos = []
    invalid_paths = []
    duplicate_mappings = {}
    slug_map = {}

    media_dir = BASE_DIR / 'static' / 'exercise_media'

    for ex in exercises:
        ex_id = ex.get('id')
        name = ex.get('name', 'Unknown')
        slug = ex.get('slug') or name.lower().replace(' ', '_').replace('-', '_')
        
        if slug in slug_map:
            duplicate_mappings[slug] = (slug_map[slug], ex_id)
        else:
            slug_map[slug] = ex_id

        video_filename = f'{slug}.mp4'
        video_path = media_dir / video_filename

        if '..' in str(video_path) or not str(video_path.resolve()).startswith(str(media_dir.resolve())):
            invalid_paths.append((name, str(video_path)))
            continue

        if video_path.exists() and video_path.stat().st_size > 0:
            available_videos.append((ex_id, name, str(video_path.relative_to(BASE_DIR))))
        else:
            missing_videos.append((ex_id, name, f'static/exercise_media/{video_filename}'))

    print(f'\nTotal exercises: {total_exercises}')
    print(f'Videos available: {len(available_videos)}')
    print(f'Videos missing: {len(missing_videos)}')
    print(f'Invalid paths: {len(invalid_paths)}')
    print(f'Duplicate media mappings: {len(duplicate_mappings)}')
    print(f'Manifest entries: {len(manifest)}')
    print('-' * 60)

    if available_videos:
        print('\n[AVAILABLE ANIMATIONS / VIDEOS]')
        for ex_id, name, path in available_videos:
            print(f'  [AVAILABLE] [{ex_id:03d}] {name} -> {path}')

    if missing_videos:
        print(f'\n[MISSING ASSETS - QUEUED FOR MEDIA CAPTURE ({len(missing_videos)} EXERCISES)]')
        for ex_id, name, expected_file in missing_videos:
            print(f'  [MISSING] [{ex_id:03d}] {name} (expected: {expected_file})')

    print('=' * 60)
    print('MEDIA AUDIT COMPLETE')
    print('=' * 60)

if __name__ == '__main__':
    run_audit()
