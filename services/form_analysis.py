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

def calculate_angle(a, b, c):
    """
    Returns angle at point b in degrees using pure math
    """
    try:
        # Vector ab
        ab_x, ab_y = a[0] - b[0], a[1] - b[1]
        # Vector cb
        cb_x, cb_y = c[0] - b[0], c[1] - b[1]
        
        # Dot product
        dot = ab_x * cb_x + ab_y * cb_y
        # Magnitudes
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
    ex_name = exercise_name.lower()
    
    # Fallback to simulator
    if not MEDIAPIPE_AVAILABLE or frame_base64 == "MOCK_FRAME":
        return get_mock_feedback(ex_name)

    try:
        header, encoded = frame_base64.split(",", 1) if "," in frame_base64 else ("", frame_base64)
        image_bytes = base64.b64decode(encoded)
        nparr = np.frombuffer(image_bytes, np.uint8)
        img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
        
        if img is None:
            return get_mock_feedback(ex_name, warning="Camera frame blank; using simulator.")

        mp_pose = mp.solutions.pose
        with mp_pose.Pose(static_image_mode=True, min_detection_confidence=0.5) as pose:
            img_rgb = cv2.cvtColor(img, cv2.COLOR_BGR2RGB)
            results = pose.process(img_rgb)

            if not results.pose_landmarks:
                return {
                    "status": "warning",
                    "feedback": "No human pose detected. Adjust camera positioning.",
                    "angle": 0,
                    "simulated": False
                }

            landmarks = results.pose_landmarks.landmark
            
            if "squat" in ex_name:
                hip = [landmarks[24].x, landmarks[24].y]
                knee = [landmarks[26].x, landmarks[26].y]
                ankle = [landmarks[28].x, landmarks[28].y]
                angle = calculate_angle(hip, knee, ankle)
                
                if angle > 160:
                    feedback = "Starting position: Stand tall, ready to lower hips."
                elif angle < 100:
                    feedback = "Excellent squat depth! Drive through your heels to rise."
                else:
                    feedback = "Go lower: Lower your hips until thighs are parallel to the floor."
                    
            elif "push-up" in ex_name or "pushup" in ex_name:
                shoulder = [landmarks[12].x, landmarks[12].y]
                elbow = [landmarks[14].x, landmarks[14].y]
                wrist = [landmarks[16].x, landmarks[16].y]
                angle = calculate_angle(shoulder, elbow, wrist)
                
                if angle > 160:
                    feedback = "Plank pose: Keep body straight, prepare to bend elbows."
                elif angle < 95:
                    feedback = "Good push-up depth! Press up explosively."
                else:
                    feedback = "Aim for depth: Push chest closer to floor, keeping elbows at 45 degrees."
                    
            else: # Bicep Curl
                shoulder = [landmarks[12].x, landmarks[12].y]
                elbow = [landmarks[14].x, landmarks[14].y]
                wrist = [landmarks[16].x, landmarks[16].y]
                angle = calculate_angle(shoulder, elbow, wrist)
                
                if angle > 150:
                    feedback = "Arm extended: Squeeze triceps, ready to curl."
                elif angle < 50:
                    feedback = "Peak contraction! Squeeze biceps, lower slowly."
                else:
                    feedback = "Keep curling: Lift dumbbells towards shoulders, locking elbows in place."

            return {
                "status": "success",
                "feedback": feedback,
                "angle": round(angle, 1),
                "simulated": False
            }

    except Exception as e:
        return get_mock_feedback(ex_name, warning=f"Analysis error: {str(e)}")

def get_mock_feedback(ex_name, warning=None):
    t = datetime.now().timestamp()
    wave = (math.sin(t * 1.5) + 1.0) / 2.0
    
    if "squat" in ex_name:
        angle = 80 + (wave * 100)
        if angle > 160:
            feedback = "Simulated: Standing straight. Ready to start squat."
        elif angle < 100:
            feedback = "Simulated: Great squat depth. Core engaged."
        else:
            feedback = "Simulated: Lowering hips... try to reach parallel."
            
    elif "push-up" in ex_name or "pushup" in ex_name:
        angle = 85 + (wave * 90)
        if angle > 160:
            feedback = "Simulated: Plank hold. Keep hips aligned."
        elif angle < 95:
            feedback = "Simulated: Good chest depth. Preparing to push up."
        else:
            feedback = "Simulated: Bending elbows. Keep neck neutral."
            
    else: # Bicep Curl
        angle = 45 + (wave * 125)
        if angle > 150:
            feedback = "Simulated: Arms fully extended. Flex to curl."
        elif angle < 50:
            feedback = "Simulated: Peak bicep squeeze. Lower slowly."
        else:
            feedback = "Simulated: Mid-curl. Keep elbows close to sides."

    resp = {
        "status": "success",
        "feedback": feedback,
        "angle": round(angle, 1),
        "simulated": True
    }
    if warning:
        resp["warning"] = warning
        
    return resp
