import json
from app import app, Exercise
from services.form_analysis import check_exercise_form

def test_all_exercises():
    with app.app_context():
        all_exercises = Exercise.query.order_by(Exercise.id).all()
        print(f"Total exercises found in database: {len(all_exercises)}")
        
        results = []
        failed = []

        for ex in all_exercises:
            ex_id = ex.id
            name = ex.name
            category = ex.category
            equipment = ex.equipment
            
            # Test backend Python form analysis rule evaluation
            try:
                res = check_exercise_form(name, "MOCK_FRAME")
                status = res.get("status")
                feedback = res.get("feedback")
                phase = res.get("phase")
                score = res.get("score")
                
                if status == "success" and feedback and score is not None:
                    test_status = "PASS"
                else:
                    test_status = "FAIL"
                    failed.append(name)
            except Exception as e:
                test_status = f"ERROR ({str(e)})"
                failed.append(name)

            results.append({
                "id": ex_id,
                "name": name,
                "category": category,
                "equipment": equipment,
                "test_status": test_status,
                "sample_feedback": feedback,
                "sample_phase": phase,
                "sample_score": score
            })

        print("\n" + "="*80)
        print(f"{'ID':<4} | {'EXERCISE NAME':<32} | {'CATEGORY':<14} | {'STATUS':<6} | {'SCORE':<5} | {'SAMPLE FEEDBACK'}")
        print("="*80)
        for r in results:
            fb = r['sample_feedback'][:45] + "..." if len(r['sample_feedback']) > 45 else r['sample_feedback']
            print(f"{r['id']:<4} | {r['name']:<32} | {r['category']:<14} | {r['test_status']:<6} | {r['sample_score']:<5} | {fb}")
        print("="*80)
        print(f"\nSUMMARY: {len(results) - len(failed)}/{len(results)} EXERCISES PASSED FORM CHECK TEST.")
        if failed:
            print(f"FAILED EXERCISES: {failed}")

if __name__ == "__main__":
    test_all_exercises()
