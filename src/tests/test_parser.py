import os
from src.parser.regex_parser import RegexParser

def test_platform_detection():
    parser = RegexParser()
    
    gh_text = "github.com/actions/runner-job\n##[add-matcher]python-matcher"
    assert parser.detect_platform(gh_text) == "github"
    
    jenkins_text = "Running on Jenkins in /var/jenkins\n[Pipeline] stage (Compile)"
    assert parser.detect_platform(jenkins_text) == "jenkins"
    
    gitlab_text = "Running on gitlab-runner-52bf8741\nJob failed"
    assert parser.detect_platform(gitlab_text) == "gitlab"

def test_github_parsing():
    parser = RegexParser()
    log = """
    2026-06-02T10:14:22Z ##[group]Starting Build
    2026-06-02T10:14:23Z ##[error]Process completed with exit code 127.
    """
    res = parser.parse(log, platform_hint="github")
    assert "github" in res.job_names
    assert "Process completed with exit code 127." in res.errors
    assert 127 in res.exit_codes

def test_jenkins_parsing():
    parser = RegexParser()
    log = """
    [Pipeline] stage (Compile)
    [ERROR] App.java cannot find symbol getConfigurationString
    FATAL: command execution failed
    """
    res = parser.parse(log, platform_hint="jenkins")
    assert "jenkins" in res.job_names
    assert "App.java cannot find symbol getConfigurationString" in res.errors
    assert "Compile" in res.stages
