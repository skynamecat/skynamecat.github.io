package com.skynamecat.testproject.common;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.persistence.autoconfigure.EntityScan;
import org.springframework.data.jpa.repository.config.EnableJpaRepositories;

@SpringBootApplication(scanBasePackages = "com.skynamecat.testproject")
@EntityScan("com.skynamecat.testproject")
@EnableJpaRepositories("com.skynamecat.testproject")
public class TestProjectApplication {

    public static void main(String[] args) {
        SpringApplication.run(TestProjectApplication.class, args);
    }
}
