package creo.pages;

import org.openqa.selenium.By;
import org.openqa.selenium.WebDriver;
import org.openqa.selenium.WebElement;
import org.openqa.selenium.support.ui.WebDriverWait;
import org.openqa.selenium.support.ui.ExpectedConditions;

public abstract class BasePage {

    protected final WebDriver driver;
    protected final WebDriverWait wait;

    protected BasePage(
        WebDriver driver,
        WebDriverWait wait
    ) {
        this.driver = driver;
        this.wait = wait;
    }

    protected WebElement visible(By locator) {

        return wait.until(
            ExpectedConditions
                .visibilityOfElementLocated(locator)
        );
    }

    protected void click(By locator) {

        wait.until(
            ExpectedConditions
                .elementToBeClickable(locator)
        ).click();
    }

    protected void escribir(By locator, String valor) {

        WebElement elemento = visible(locator);

        elemento.clear();
        elemento.sendKeys(valor);
    }

    protected String texto(By locator) {
        return visible(locator).getText();
    }

    protected void esperarUrl(String fragmento) {

        wait.until(
            ExpectedConditions.urlContains(fragmento)
        );
    }

    protected By testId(String id) {

        return By.cssSelector(
            "[data-testid='" + id + "']"
        );
    }
}
