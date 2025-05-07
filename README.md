# CourseRoad 2.0

CourseRoad is a tool for planning out your classes over your entire time at MIT.
It makes it easy to explore different majors and minors,
view your progress towards their requirements,
and choose which classes to take when in order to maximize your time at MIT.
CourseRoad allows you to look more than one semester ahead make fully informed choices about the big picture.

## Installation

`npm install`

## Running

`npm run dev` then go to <http://localhost:8080/>.

## Setting Up the ChatBot

CourseRoad includes an AI assistant powered by OpenAI's API. To use this feature:

### Option 1: Enter API Key in the UI
1. Click on the chat icon in the bottom right corner
2. Enter your OpenAI API key when prompted
3. Your key will be stored in your browser's localStorage (not on our servers)

### Option 2: Use Environment Variables (for local development)
1. Create a `.env` file in the project root with the following:
```
VITE_OPENAI_API_KEY=your_openai_api_key_here
VITE_LLM_MODEL=gpt-3.5-turbo
```
2. Replace `your_openai_api_key_here` with your actual OpenAI API key
3. Restart the development server if it's already running

### Getting an OpenAI API Key
1. Go to [OpenAI's API platform](https://platform.openai.com/)
2. Sign up or log in to your account
3. Navigate to the API Keys section
4. Create a new secret key
5. Copy this key and use it in CourseRoad

⚠️ **Security Note**: Never commit your API key to version control. The `.env` file is included in `.gitignore` to prevent accidental commits.

## Publishing

How to push changes to the live site:

```bash
./deploy.sh [dev|prod] [kerberos]
```

which will deploy the code to the [dev](https://courseroad.mit.edu/dev/) and [main](https://courseroad.mit.edu/) sites respectively.

**Very important:** Always deploy to `dev` and test it before deploying to `prod`!
