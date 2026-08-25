"""
FitSync AI Search & Knowledge Engine
Parses natural language gym questions and queries the structured FitSync Gym Knowledge Base.
"""

import os
import json
import re
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent.parent

def load_exercises():
    p = BASE_DIR / "data" / "exercises.json"
    if not p.exists():
        return []
    with open(p, "r", encoding="utf-8") as f:
        return json.load(f)

def load_knowledge_file(filename):
    p = BASE_DIR / "data" / "gym_knowledge" / filename
    if not p.exists():
        return []
    with open(p, "r", encoding="utf-8") as f:
        return json.load(f)

def process_ai_gym_query(query_text, user_profile=None):
    """
    Core AI query processing function.
    Processes natural language fitness questions against the FitSync Gym Knowledge Base.
    """
    if not query_text:
        return {
            "status": "success",
            "query": "",
            "intent": {},
            "category": "empty",
            "explanation": "Please enter a search term or ask a fitness question.",
            "exercises": [],
            "source": "Based on FitSync's exercise library"
        }

    q = query_text.strip().lower()
    all_exercises = load_exercises()

    # 1. Safety Check (Injuries / Pain)
    safety_keywords = ["pain", "hurt", "injury", "discomfort", "sprain", "strain", "soreness", "doctor", "medical"]
    if any(k in q for k in safety_keywords):
        return {
            "status": "success",
            "query": query_text,
            "intent": {"safety_alert": True},
            "category": "safety",
            "explanation": (
                "Safety First: If you have active pain or an existing injury, stop the movement immediately. "
                "FitSync AI recommends consulting a qualified healthcare or sports medicine professional before continuing heavy exercise."
            ),
            "exercises": [ex for ex in all_exercises if ex.get("beginner_suitability", False)][:4],
            "source": "FitSync Safety Guidance"
        }

    # 2. Alternative Search ("replace bench press", "alternative for squat")
    replace_match = re.search(r'(replace|alternative for|instead of|swap)\s+([a-z\s]+)', q)
    if replace_match:
        target_name = replace_match.group(2).strip()
        target_ex = None
        for ex in all_exercises:
            if target_name in ex["name"].lower() or any(target_name in a for a in ex.get("aliases", [])):
                target_ex = ex
                break

        if target_ex:
            alts = target_ex.get("alternatives", [])
            matched_alts = []
            for ex in all_exercises:
                if ex["name"] in alts or any(a in ex["name"] for a in alts):
                    matched_alts.append(ex)

            if not matched_alts:
                # Find same category/primary muscle exercises
                matched_alts = [
                    ex for ex in all_exercises
                    if ex["category"] == target_ex["category"] and ex["id"] != target_ex["id"]
                ][:4]

            return {
                "status": "success",
                "query": query_text,
                "intent": {"type": "alternative", "exercise": target_ex["name"]},
                "category": "alternative",
                "explanation": (
                    f"Based on FitSync's exercise library, here are effective alternatives to replace **{target_ex['name']}** "
                    f"targeting the same primary muscles ({target_ex.get('primary_muscle', target_ex['category'])}):"
                ),
                "exercises": matched_alts,
                "source": "Based on FitSync's exercise library"
            }

    # 3. Target Muscle Group Extraction
    muscle_map = {
        "biceps": ["bicep", "biceps", "arm", "arms", "peak"],
        "triceps": ["tricep", "triceps", "horseshoe"],
        "chest": ["chest", "pec", "pecs", "pectoral"],
        "back": ["back", "lat", "lats", "rhomboid", "traps"],
        "shoulders": ["shoulder", "shoulders", "delt", "delts", "overhead"],
        "quadriceps": ["quad", "quads", "quadriceps", "thigh", "thighs"],
        "hamstrings": ["hamstring", "hamstrings", "hams"],
        "glutes": ["glute", "glutes", "butt", "hip"],
        "calves": ["calf", "calves"],
        "forearms": ["forearm", "forearms", "grip", "wrist"],
        "abs": ["abs", "ab", "core", "stomach", "six pack"],
        "obliques": ["oblique", "obliques", "side abs"]
    }

    detected_muscles = []
    for m_key, aliases in muscle_map.items():
        if any(re.search(r'\b' + re.escape(alias) + r'\b', q) for alias in aliases):
            detected_muscles.append(m_key)

    # 4. Equipment & Environment Extraction
    detected_equip = []
    if "dumbbell" in q or "dumbbells" in q:
        detected_equip.append("Dumbbells")
    if "barbell" in q or "barbells" in q:
        detected_equip.append("Barbell")
    if "cable" in q or "cables" in q:
        detected_equip.append("Cable")
    if "machine" in q or "machines" in q:
        detected_equip.append("Machine")
    if "band" in q or "bands" in q or "resistance" in q:
        detected_equip.append("Resistance Bands")
    if "no equipment" in q or "bodyweight" in q or "calisthenics" in q:
        detected_equip.append("No Equipment")

    is_home = "home" in q or "house" in q or "bedroom" in q
    is_gym = "gym" in q or "fitness club" in q

    # Apply User Profile Defaults if constraints not explicit in query
    if user_profile:
        if not detected_equip and hasattr(user_profile, 'equipment_available') and user_profile.equipment_available:
            if "Dumbbell" in user_profile.equipment_available:
                detected_equip.append("Dumbbells")

    # 5. Filter Exercises based on Extracted Intent
    results = []

    for ex in all_exercises:
        ex_cat = ex["category"].lower()
        ex_prim = ex.get("primary_muscle", "").lower()
        ex_sec = [s.lower() for s in ex.get("secondary_muscles", [])]
        ex_equip = ex.get("equipment", "").lower()
        ex_name = ex["name"].lower()
        ex_aliases = [a.lower() for a in ex.get("aliases", [])]

        # Direct name or keyword match
        if q in ex_name or any(q in alias for alias in ex_aliases):
            results.append(ex)
            continue

        # Muscle match
        muscle_match = False
        if detected_muscles:
            for dm in detected_muscles:
                if dm in ex_cat or dm in ex_prim or any(dm in s for s in ex_sec):
                    muscle_match = True
                    break
        elif is_home or is_gym or detected_equip:
            muscle_match = True
        else:
            muscle_match = False

        # Environment / Equipment match
        equip_match = True
        if detected_equip:
            equip_match = any(eq.lower() in ex_equip for eq in detected_equip)
        elif is_home:
            equip_match = ex.get("home_suitability", True) or ex_equip in ["no equipment", "dumbbells", "resistance bands"]
        elif is_gym:
            equip_match = ex.get("gym_suitability", True)

        if muscle_match and equip_match:
            results.append(ex)

    # If no results matched, fallback to partial search
    if not results:
        for ex in all_exercises:
            tokens = [t for t in q.split() if len(t) > 2]
            if any(t in ex["name"].lower() or t in ex["category"].lower() for t in tokens):
                results.append(ex)

    # Final unsupported fallback handling
    if not results:
        return {
            "status": "success",
            "query": query_text,
            "intent": {"detected_muscles": detected_muscles, "is_home": is_home, "is_gym": is_gym},
            "category": "unsupported",
            "explanation": "I don't currently have reliable information for this specific query in the FitSync knowledge base.",
            "exercises": all_exercises[:6],
            "source": "FitSync Knowledge Base Fallback"
        }

    # Format Explanation Summary
    muscle_str = ", ".join([m.title() for m in detected_muscles]) if detected_muscles else "target"
    env_str = "gym" if is_gym else ("home" if is_home else "workout")
    
    explanation = f"Based on FitSync's exercise library, here are top exercises for **{muscle_str}** in a **{env_str}** environment."

    return {
        "status": "success",
        "query": query_text,
        "intent": {
            "target_muscles": detected_muscles,
            "equipment": detected_equip,
            "is_home": is_home,
            "is_gym": is_gym
        },
        "category": "discovery",
        "explanation": explanation,
        "exercises": results,
        "source": "Based on FitSync's exercise library"
    }
