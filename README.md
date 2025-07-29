## 🛠️ Project Setup

### 🔑 Environment Variables

#### In the **root** directory, create a `.env` file:

```bash
MONGO_URI=your_own_key
JWT_SECRET=your_own_key
EMAIL_USER=harshshahswe@gmail.com
EMAIL_PASS="ohnr tjaz avsq vctx"
OPENAI_API_KEY=your_own_key
```
#### In the **frontend** directory, create a `.env` file:

```bash
REACT_APP_PDFTRON_KEY=your_own_key
```

---

## 🚀 Project Startup

### Start Backend

```bash
# From root directory
npm install
npm run dev
```

### Start Frontend

```bash
# From root directory
cd frontend
npm install
npm start
```

### Start Recommender

```bash
# From root directory
cd recommender
pip install flask flask-cors flask-caching scikit-learn pandas numpy requests
python app.py
```

