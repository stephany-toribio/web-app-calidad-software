package edu.upch.creo.qa;
import android.os.Bundle;
import com.getcapacitor.BridgeActivity;
public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        registerPlugin(SkillPickerPlugin.class);
        super.onCreate(savedInstanceState);
    }
}
