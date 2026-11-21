pipeline {
    agent any
    environment {
        DOCKER_IMAGE = "sushamita152/devops-arena"
    }
    stages {
        stage('Checkout') {
            steps {
                checkout scm
            }
        }
        stage('Build') {
            steps {
                sh 'docker build -t $DOCKER_IMAGE:latest .'
            }
        }
        stage('Push') {
            steps {
                withCredentials([usernamePassword(credentialsId: 'dockerhub-creds', usernameVariable: 'USER', passwordVariable: 'PASS')]) {
                    sh 'echo $PASS | docker login -u $USER --password-stdin'
                    sh 'docker push $DOCKER_IMAGE:latest'
                }
            }
        }
        stage('Deploy') {
            steps {
                sh '''
                docker stop devops-arena || true
                docker rm devops-arena || true
                docker run -d --name devops-arena -p 80:80 $DOCKER_IMAGE:latest
                '''
            }
        }
    }
}
