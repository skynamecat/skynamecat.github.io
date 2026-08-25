package com.skynamecat.testproject.admin;

import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;

@Controller
public class ManageLoginController {

    @GetMapping("/manage/login")
    String login() {
        return "manage/login";
    }
}
