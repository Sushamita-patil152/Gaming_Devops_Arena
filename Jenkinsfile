pipeline {
    agent any
    environment {
        DOCKER_IMAGE = "sushamita152/devops-arena"
        IMAGE_TAG="seebamaldar"

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
        // Push to your account
        withCredentials([usernamePassword(
            credentialsId: 'dockerhub-creds',
            usernameVariable: 'USER1',
            passwordVariable: 'PASS1'
        )]) {
            sh '''
                echo "$PASS1" | docker login -u "$USER1" --password-stdin
                docker tag sushamita152/devops-arena:latest seebamaldar/devops-arena:latest
                docker push seebamaldar/devops-arena:latest
            '''
        }

        // Push to friend's account
        withCredentials([usernamePassword(
            credentialsId: 'dockerhub-friend',
            usernameVariable: 'USER2',
            passwordVariable: 'PASS2'
        )]) {
            sh '''
                echo "$PASS2" | docker login -u "$USER2" --password-stdin
                docker tag sushamita152/devops-arena:latest sushamita152/devops-arena:latest
                docker push sushamita152/devops-arena:latest
            '''
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
