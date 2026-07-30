import json
import os

from flask import Flask, jsonify, render_template, request
from google import genai

app = Flask(__name__)

# Model used for the AI "style this outfit" feature. Override with an env var if needed.
GEMINI_MODEL = os.environ.get("GEMINI_MODEL", "gemini-3.5-flash")

CATEGORIES = ["hat", "top", "bottom", "shoes"]

OPTIONS = {
    "hat": [
        {"name": "Waxed Canvas Bucket Hat", "store": "Fieldstone Supply Co.", "price": 38, "color": "#8A6E4B", "description": "Rain-stiffened canvas with a stitched brim that holds its shape in wind."},
        {"name": "Wool Newsboy Cap", "store": "Harlow & Finch", "price": 52, "color": "#3B4A5A", "description": "Eight-panel wool cap with a snap brim, cut from mill-end herringbone."},
        {"name": "Knit Watch Cap", "store": "Northline Goods", "price": 24, "color": "#7A2E2E", "description": "Ribbed merino watch cap, double-folded for a clean cuffed edge."},
        {"name": "Straw Boater", "store": "Reyes & Sun", "price": 46, "color": "#D8B65A", "description": "Stiff-woven straw boater with a grosgrain band."},
        {"name": "Corduroy Ball Cap", "store": "Fieldstone Supply Co.", "price": 29, "color": "#5B6B3E", "description": "Unstructured corduroy cap with a low crown and curved brim."},
    ],
    "top": [
        {"name": "Oversized Chambray Shirt", "store": "Harlow & Finch", "price": 68, "color": "#5C7A96", "description": "Washed chambray with a dropped shoulder and mismatched button stack."},
        {"name": "Ribbed Turtleneck", "store": "Northline Goods", "price": 54, "color": "#2E2A26", "description": "Fine-gauge ribbed turtleneck in a heavyweight cotton blend."},
        {"name": "Boxy Denim Jacket", "store": "Reyes & Sun", "price": 96, "color": "#3A5470", "description": "Cropped denim jacket with a boxy fit and raw hem."},
        {"name": "Linen Camp Shirt", "store": "Fieldstone Supply Co.", "price": 58, "color": "#C7B79A", "description": "Short-sleeve linen shirt with a camp collar, cut for airflow."},
        {"name": "Striped Boatneck Tee", "store": "Harlow & Finch", "price": 34, "color": "#22344A", "description": "Cotton boatneck tee in a classic mariner stripe."},
    ],
    "bottom": [
        {"name": "Wide-Leg Trousers", "store": "Reyes & Sun", "price": 78, "color": "#4A4438", "description": "High-rise wide-leg trousers with a deep double pleat."},
        {"name": "Selvedge Denim", "store": "Northline Goods", "price": 89, "color": "#2C3E52", "description": "Straight-leg selvedge denim, rigid until it breaks in."},
        {"name": "Corduroy Trousers", "store": "Fieldstone Supply Co.", "price": 64, "color": "#6B4A2E", "description": "Wide-wale corduroy trousers with a relaxed taper."},
        {"name": "Pleated Chinos", "store": "Harlow & Finch", "price": 58, "color": "#8A8267", "description": "Twill chinos with a single pleat and a soft, worn-in hand."},
        {"name": "Cargo Utility Pants", "store": "Northline Goods", "price": 72, "color": "#4E5A3E", "description": "Six-pocket utility pants in ripstop cotton."},
    ],
    "shoes": [
        {"name": "Suede Desert Boots", "store": "Reyes & Sun", "price": 118, "color": "#A9764F", "description": "Crepe-soled desert boots in sand suede, built to age well."},
        {"name": "Canvas Low-Tops", "store": "Northline Goods", "price": 46, "color": "#EDEAE0", "description": "Vulcanized canvas low-tops with a plain toe cap."},
        {"name": "Leather Chelsea Boots", "store": "Harlow & Finch", "price": 142, "color": "#3A2C24", "description": "Elastic-gusset Chelsea boots in burnished leather."},
        {"name": "Wool Slip-Ons", "store": "Fieldstone Supply Co.", "price": 62, "color": "#5A5A52", "description": "Knit wool slip-ons with a molded foam sole."},
        {"name": "Trail Runners", "store": "Northline Goods", "price": 98, "color": "#3E5A4E", "description": "Lightweight trail runners with a lugged rubber outsole."},
    ],
}


@app.route("/")
def index():
    return render_template("index.html", options_json=json.dumps(OPTIONS))


@app.route("/api/generate-outfit", methods=["POST"])
def generate_outfit():
    data = request.get_json(silent=True) or {}
    prompt = (data.get("prompt") or "").strip()
    pools = data.get("pools") or {}

    if not prompt:
        return jsonify({"error": "Missing style prompt."}), 400

    for cat in CATEGORIES:
        if not isinstance(pools.get(cat), list) or not pools[cat]:
            return jsonify({"error": f"Missing item list for '{cat}'."}), 400

    api_key = os.environ.get("GEMINI_API_KEY")
    if not api_key:
        return jsonify({"error": "Server is missing GEMINI_API_KEY."}), 500

    client = genai.Client(api_key=api_key)

    system_prompt = (
        "You style outfits. Given a style request and lists of available items per "
        "category, pick the single best item index per category. Respond ONLY with "
        "compact JSON, no prose, no markdown fences, in exactly this shape: "
        '{"hat":0,"top":0,"bottom":0,"shoes":0}'
    )
    user_content = (
        f'Style request: "{prompt}"\n\n'
        f"Available items by category (choose by index):\n{json.dumps(pools)}"
    )

    try:
        response = client.models.generate_content(
            model=GEMINI_MODEL,
            contents=f"{system_prompt}\n\n{user_content}",
        )
    except Exception as exc:  # noqa: BLE001
        return jsonify({"error": f"Gemini API request failed: {exc}"}), 502

    text = getattr(response, "text", "") or ""
    cleaned = text.replace("```json", "").replace("```", "").strip()

    try:
        picks = json.loads(cleaned)
    except json.JSONDecodeError:
        return jsonify({"error": "Could not parse a styling response. Try again."}), 502

    result = {}
    for cat in CATEGORIES:
        idx = picks.get(cat)
        pool = pools[cat]
        if isinstance(idx, int) and 0 <= idx < len(pool):
            result[cat] = idx

    if not result:
        return jsonify({"error": "The stylist didn't return usable picks. Try again."}), 502

    return jsonify({"picks": result})


if __name__ == "__main__":
    app.run(debug=True, port=5000)