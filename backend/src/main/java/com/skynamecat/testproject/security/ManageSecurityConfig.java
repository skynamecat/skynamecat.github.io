package com.skynamecat.testproject.security;

import java.security.SecureRandom;
import java.util.Base64;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.env.Environment;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.core.userdetails.User;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.provisioning.InMemoryUserDetailsManager;
import org.springframework.security.web.SecurityFilterChain;

@Configuration
public class ManageSecurityConfig {

    private static final Logger log = LoggerFactory.getLogger(ManageSecurityConfig.class);

    @Bean
    SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http
                .csrf(csrf -> csrf.ignoringRequestMatchers("/api/**"))
                .authorizeHttpRequests(authorize -> authorize
                        .requestMatchers("/manage/login", "/manage/assets/**", "/error").permitAll()
                        .requestMatchers("/manage/**").hasRole("ADMIN")
                        .anyRequest().permitAll())
                .formLogin(form -> form
                        .loginPage("/manage/login")
                        .loginProcessingUrl("/manage/login")
                        .defaultSuccessUrl("/manage", true)
                        .failureUrl("/manage/login?error")
                        .permitAll())
                .logout(logout -> logout
                        .logoutUrl("/manage/logout")
                        .logoutSuccessUrl("/manage/login?logout")
                        .invalidateHttpSession(true)
                        .deleteCookies("JSESSIONID"));

        return http.build();
    }

    @Bean
    PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    @Bean
    UserDetailsService manageUserDetailsService(Environment environment, PasswordEncoder passwordEncoder) {
        String username = environment.getProperty("MANAGE_USERNAME", "admin").trim();
        String password = environment.getProperty("MANAGE_PASSWORD", "");
        if (password.isBlank()) {
            byte[] randomBytes = new byte[24];
            new SecureRandom().nextBytes(randomBytes);
            password = Base64.getUrlEncoder().withoutPadding().encodeToString(randomBytes);
            log.warn("MANAGE_PASSWORD is not set. Temporary /manage password for user '{}': {}", username, password);
        }

        return new InMemoryUserDetailsManager(User.withUsername(username)
                .password(passwordEncoder.encode(password))
                .roles("ADMIN")
                .build());
    }
}
