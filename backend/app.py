from flask import Flask, request, jsonify
from router.router import route_request

app = Flask(__name__)

@app.route('/chat', methods=['POST'])
def chat():
    data = request.get_json()
    message = data.get('message', '')
    user_id = data.get('user_id', '')
    if not message or not isinstance(message, str) or message.strip() == '':
        return jsonify({"error": "Le champ 'message' est requis et ne peut pas être vide."}), 400
    response = route_request(message, user_id)
    return jsonify(response)

if __name__ == '__main__':
    app.run(debug=True)
