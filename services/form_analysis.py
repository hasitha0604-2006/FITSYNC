import base64
import random
import math
from datetime import datetime

# Try importing MediaPipe and OpenCV
try:
    import cv2
    import numpy as np
    import mediapipe as mp
    MEDIAPIPE_AVAILABLE = True
except ImportError:
    MEDIAPIPE_AVAILABLE = False

_mp_pose_instance = None

def get_pose_estimator():
    global _mp_pose_instance
    if not MEDIAPIPE_AVAILABLE:
        return None
    if _mp_pose_instance is None:
        try:
            mp_pose = mp.solutions.pose
            _mp_pose_instance = mp_pose.Pose(
                static_image_mode=False,
                model_complexity=1,
                smooth_landmarks=True,
                min_detection_confidence=0.5,
                min_tracking_confidence=0.5
            )
        except Exception:
            _mp_pose_instance = None
    return _mp_pose_instance

def calculate_angle(a, b, c):
    """
    Returns angle at point b in degrees using 2D vectors
    """
    try:
        ab_x, ab_y = a[0] - b[0], a[1] - b[1]
        cb_x, cb_y = c[0] - b[0], c[1] - b[1]
        
        dot = ab_x * cb_x + ab_y * cb_y
        mag_ab = math.sqrt(ab_x**2 + ab_y**2)
        mag_cb = math.sqrt(cb_x**2 + cb_y**2)
        
        if mag_ab == 0 or mag_cb == 0:
            return 180.0
            
        cos_angle = dot / (mag_ab * mag_cb)
        cos_angle = max(-1.0, min(1.0, cos_angle))
        
        angle = math.degrees(math.acos(cos_angle))
        return angle
    except Exception:
        return 180.0

def check_exercise_form(exercise_name, frame_base64):
    """
    Evaluates body positioning. Falls back to simulator if media tools are unavailable.
    """
    ex_name = (exercise_name or "squat").lower()
    
    if not MEDIAPIPE_AVAILABLE or frame_base64 == "MOCK_FRAME":
        return get_mock_feedback(ex_name)

    try:
        header, encoded = frame_base64.split(",", 1) if "," in frame_base64 else ("", frame_base64)
        image_bytes = base64.b64decode(encoded)
        nparr = np.frombuffer(image_bytes, np.uint8)
        img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
        
        if img is None:
            return get_mock_feedback(ex_name, warning="Camera frame blank; using simulator.")

        pose = get_pose_estimator()
        if pose is None:
            return get_mock_feedback(ex_name)

        img_rgb = cv2.cvtColor(img, cv2.COLOR_BGR2RGB)
        results = pose.process(img_rgb)

        if not results.pose_landmarks:
            return {
                "status": "warning",
                "feedback": "No human pose detected. Step back into full camera view.",
                "angle": 0,
                "score": 0,
                "phase": "Searching",
                "simulated": False
            }

        landmarks = results.pose_landmarks.landmark
        
        if "squat" in ex_name:
            hip = [landmarks[24].x, landmarks[24].y]
            knee = [landmarks[26].x, landmarks[26].y]
            ankle = [landmarks[28].x, landmarks[28].y]
            angle = calculate_angle(hip, knee, ankle)
            
            if angle > 155:
                feedback = "Starting stance: Stand tall, chest up, ready to lower hips."
                phase = "Start"
                score = 100
            elif angle < 95:
                feedback = "🔥 Excellent depth! Thighs parallel to floor. Drive through heels."
                phase = "Peak Contraction"
                score = 98
            else:
                feedback = "Go lower: Continue descending until hips are parallel to knees."
                phase = "Eccentric Descent"
                score = 82
                
        elif "push-up" in ex_name or "pushup" in ex_name:
            shoulder = [landmarks[12].x, landmarks[12].y]
            elbow = [landmarks[14].x, landmarks[14].y]
            wrist = [landmarks[16].x, landmarks[16].y]
            angle = calculate_angle(shoulder, elbow, wrist)
            
            if angle > 155:
                feedback = "Plank alignment: Solid core brace, prepare to lower chest."
                phase = "Start"
                score = 100
            elif angle < 90:
                feedback = "🔥 Perfect push-up depth! Chest to floor, press up explosively."
                phase = "Peak Contraction"
                score = 96
            else:
                feedback = "Lower chest closer to floor, keeping elbows tucked at 45°."
                phase = "Descent"
                score = 80

        elif "overhead" in ex_name or "shoulder_press" in ex_name or "military" in ex_name or "press" in ex_name:
            shoulder = [landmarks[12].x, landmarks[12].y]
            elbow = [landmarks[14].x, landmarks[14].y]
            wrist = [landmarks[16].x, landmarks[16].y]
            angle = calculate_angle(shoulder, elbow, wrist)

            if angle > 155:
                feedback = "🔥 Full lockout overhead! Squeeze deltoids and brace core."
                phase = "Lockout"
                score = 98
            elif angle < 85:
                feedback = "Rack position: Elbows in front, drive bar straight upward."
                phase = "Start"
                score = 100
            else:
                feedback = "Drive upward: Press arms fully overhead without arching lower back."
                phase = "Concentric Lift"
                score = 85

        elif "lunge" in ex_name:
            hip = [landmarks[24].x, landmarks[24].y]
            knee = [landmarks[26].x, landmarks[26].y]
            ankle = [landmarks[28].x, landmarks[28].y]
            angle = calculate_angle(hip, knee, ankle)

            if angle > 150:
                feedback = "Standing start: Take a controlled step forward."
                phase = "Start"
                score = 100
            elif angle < 100:
                feedback = "🔥 Perfect lunge depth! Front knee at 90°, torso upright."
                phase = "Peak Contraction"
                score = 95
            else:
                feedback = "Lower back knee toward floor while keeping front knee behind toes."
                phase = "Descent"
                score = 82

        elif "plank" in ex_name:
            shoulder = [landmarks[12].x, landmarks[12].y]
            hip = [landmarks[24].x, landmarks[24].y]
            ankle = [landmarks[28].x, landmarks[28].y]
            angle = calculate_angle(shoulder, hip, ankle)

            if 165 <= angle <= 180:
                feedback = "🔥 Flawless plank alignment! Spine straight and glutes squeezed."
                phase = "Hold"
                score = 100
            elif angle < 165:
                feedback = "Hips sagging: Lift hips in line with shoulders and brace core."
                phase = "Adjustment"
                score = 70
            else:
                feedback = "Hips too high: Lower hips slightly to form a flat tabletop line."
                phase = "Adjustment"
                score = 75
                
        else: # Bicep Curl
            shoulder = [landmarks[12].x, landmarks[12].y]
            elbow = [landmarks[14].x, landmarks[14].y]
            wrist = [landmarks[16].x, landmarks[16].y]
            angle = calculate_angle(shoulder, elbow, wrist)
            
            if angle > 150:
                feedback = "Full arm extension: Ready to curl with strict elbow lock."
                phase = "Start"
                score = 100
            elif angle < 50:
                feedback = "🔥 Maximum bicep squeeze! Squeeze peak, lower under control."
                phase = "Peak Contraction"
                score = 98
            else:
                feedback = "Curl upward: Drive hands toward shoulders without swinging elbows."
                phase = "Concentric Curl"
                score = 84

        return {
            "status": "success",
            "feedback": feedback,
            "angle": round(angle, 1),
            "score": score,
            "phase": phase,
            "simulated": False
        }

    except Exception as e:
        return get_mock_feedback(ex_name, warning=f"Analysis: {str(e)}")

def get_mock_feedback(ex_name, warning=None):
    t = datetime.now().timestamp()
    wave = (math.sin(t * 1.6) + 1.0) / 2.0
    
    if "squat" in ex_name:
        angle = 80 + (wave * 100)
        if angle > 155:
            feedback = "Simulated: Standing straight. Ready to start squat."
            phase = "Start"
            score = 100
        elif angle < 100:
            feedback = "Simulated: 🔥 Great squat depth. Thighs parallel."
            phase = "Peak Contraction"
            score = 98
        else:
            feedback = "Simulated: Lowering hips... reach parallel depth."
            phase = "Eccentric Descent"
            score = 85
            
    elif "push-up" in ex_name or "pushup" in ex_name:
        angle = 80 + (wave * 95)
        if angle > 155:
            feedback = "Simulated: Plank hold. Keep hips aligned."
            phase = "Start"
            score = 100
        elif angle < 95:
            feedback = "Simulated: 🔥 Good chest depth. Press up."
            phase = "Peak Contraction"
            score = 96
        else:
            feedback = "Simulated: Bending elbows. Keep neck neutral."
            phase = "Descent"
            score = 82

    elif "overhead" in ex_name or "press" in ex_name:
        angle = 75 + (wave * 105)
        if angle > 155:
            feedback = "Simulated: 🔥 Full lockout overhead. Core braced."
            phase = "Lockout"
            score = 98
        else:
            feedback = "Simulated: Driving barbell/dumbbells overhead."
            phase = "Concentric Lift"
            score = 86

    elif "lunge" in ex_name:
        angle = 85 + (wave * 85)
        if angle < 100:
            feedback = "Simulated: 🔥 Perfect lunge depth. 90° knee angle."
            phase = "Peak Contraction"
            score = 95
        else:
            feedback = "Simulated: Lowering back knee with upright posture."
            phase = "Descent"
            score = 84

    elif "plank" in ex_name:
        angle = 170 + (math.sin(t) * 8)
        feedback = "Simulated: 🔥 Strong plank brace. Maintain horizontal spine."
        phase = "Hold"
        score = 96
            
    else: # Bicep Curl
        angle = 40 + (wave * 130)
        if angle > 150:
            feedback = "Simulated: Arms fully extended. Ready to curl."
            phase = "Start"
            score = 100
        elif angle < 50:
            feedback = "Simulated: 🔥 Peak bicep squeeze. Lower with 2-3s tempo."
            phase = "Peak Contraction"
            score = 98
        else:
            feedback = "Simulated: Mid-curl tension. Keep elbows anchored."
            phase = "Concentric Curl"
            score = 85

    resp = {
        "status": "success",
        "feedback": feedback,
        "angle": round(angle, 1),
        "score": score,
        "phase": phase,
        "simulated": True
    }
    if warning:
        resp["warning"] = warning
        
    return resp

