## LLA - Law and Legel Advisor

- An Genrative Ai chatbot Web Application which helps use understand the Law and Constitution of India, and Analyze contracts, legell documents , and agreements the and explain then in simple words, give there judgement/legel advise based on the constitution and benefit of both parties involved in the legel matter.  

## Purpose and Scope 

* The Application helps comman people understand the legel document and information in simple way
* It will insure the legel trust among comman public and explaining the legel information
* It will be used by people of india who are not fully fimiler with the laws of india.
* Prevent unfair practices or action due to not having knowledge about the law and constitution of india 
* Benefit of both parties involved in the legel contract, agreement or action.


## functional requirements:

1. Extract information form documents for explaining to user
2. explain the information in simple way
3. explain and compare the contract and agreements, policies (benefits, disadvantages, and outcomes) then also tell user what can be fair nagotiation(both parties win )
4. Highlighting important clauses, obligations, risks, or inconsistencies based on constitution and regulations.
5. Answers questions based on the legel documents and current regulations
6. help user understand there options and tell what can be done next(if highly complex or risky should advise to take legell help from advocates).
7. Generate summaries checklist and other actionable output.
8. Helping users prepare information or questions for a legal professional

## Non-functional Requirements

1. Fair use of the tool no illegl use of it(e.g Fair for both parties in contract)
2. Correctness: the statement given should be according to current regulation and constitution of india, System must retrieve grounding text from a verified legal corpus (via RAG) before generating any statutory claim.
3. reliblity/Reasonability: while giving the Reason should tell why and what, should give legel cluases sections and chapter acts of constitution while giving judgement, and judgement should be reliable, claims without retrieved support must be flagged as low-confidence rather than stated as fact..
4. Security: the contracts and all uploaded should stay confidencal no attempt to access and miss use by other, for the securely storeing data we are using firebase and pinecone database which provides encryption by defualt 
5. performance: Whole application should be lightweight fast and responsive (Size of repository must be less then 10mb)
6. Usability: The application should be easily accesiible to indian people in different languages and easy UI to make every one use app easily.
7. Availability: Should available to user most of the time
8. Scalable: should be resposive if number of user increased exponestially.
9. need this Disclimer in every chat : The system must always disclose it is not a substitute for licensed legal counsel, and must flag high-risk/high-complexity matters explicitly. 
10. Multilingual Support: Support at least Hindi, English and one regional language (e.g., Marathi). 
11. Input Limit: Limit the size of uploaded documents to manage computational load and ensure prompt processing.
12. Legal Consistency: Must ensure that the AI’s responses are consistent with the Indian Penal Code, Indian Contract Act, and relevant constitutional provisions. Where there is a conflict between a state law and a central law, the AI should prioritize the central law or provide a nuanced response highlighting the potential conflict.
13. The laws changes over the time so the software also need to change its version updating the judgement given based on the current law
## Design and Implementation :

## Tech Stack
1. Groq and Gemini API key
2. Firebase Authentication
3. Next.js- frontend
4. FastAPI- backend
5. Firebase as Main database(user data) and file storage 
6. RAG 
7. OCR- document parsing - teceract
8. HTML CSS and JS
9. Render for deployment backend (fastapi)
10. vercel for hosting frontend (Next.js)
11. pinecone for vector database

## Implementation Plan 

1) MVP as its hackathon project:
MVP should contain : 
i. user should able to ask questions related indian law and constitution and the LLM should explain them in easy and simple language.
ii. User should upload the agreement and contract and get the correct response and advise from the LLM, the document should be extracted using the OCR (trecract ) and make there embeddings and store in vector data base (pinecone), LLM using RAG should give response based on the documents embeddings and legel constitution and acts (should able to upload contract only if authenticated)
iii. Should provide legal judgement based on the constitution and benefit of both parties involved in the legel matter, the response should not cause unfairness on 1 party should be fair for every party involved 

2) Extended features:
i. Multi language support (english, hindi and marathi)
ii. Login and authentication using the Firebase Authentication mobile no otp or email and password
iii. Chat History (should be stored in firebase database or vector database ) 
iv. Setting of application (user should able to change there prefered language and notifications, dark/light mode)
v. 
