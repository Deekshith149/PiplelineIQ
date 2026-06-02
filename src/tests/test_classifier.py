from src.classifier.distilbert_classifier import DistilBertClassifier

def test_heuristic_classification():
    classifier = DistilBertClassifier()
    
    # Test Dependency Failure Heuristic
    res = classifier.predict("pip install -r requirements.txt failed with exit code 1")
    assert res["failure_type"] == "Dependency Failure"
    assert res["confidence"] > 0.8
    
    # Test Compilation Failure Heuristic
    res = classifier.predict("syntaxerror: invalid syntax in com/example/App.java")
    assert res["failure_type"] == "Compilation Failure"
    
    # Test Security Failure Heuristic
    res = classifier.predict("trivy found 12 high severity vulnerabilities")
    assert res["failure_type"] == "Security Failure"

    # Test Fallback stage matching
    res = classifier.predict("command failed", parsed_stages=["unit-testing"])
    assert res["failure_type"] == "Test Failure"
