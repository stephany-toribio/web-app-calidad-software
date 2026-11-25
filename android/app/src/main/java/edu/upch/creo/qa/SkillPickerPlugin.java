package edu.upch.creo.qa;

import android.app.AlertDialog;
import android.widget.Toast;
import com.getcapacitor.JSArray;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import org.json.JSONObject;
import java.util.HashSet;
import java.util.Set;
import java.util.concurrent.atomic.AtomicBoolean;

/** Real Android multi-choice list. No network, preferences, or automatic writes. */
@CapacitorPlugin(name = "SkillPicker")
public class SkillPickerPlugin extends Plugin {
    private AlertDialog activeDialog;

    @PluginMethod
    public void choose(PluginCall call) {
        JSArray options = call.getArray("options");
        JSArray selected = call.getArray("selectedIds", new JSArray());
        if (options == null || options.length() == 0 || options.length() > 500) {
            call.reject("Catálogo de habilidades vacío o inválido.");
            return;
        }
        final int[] ids = new int[options.length()];
        final String[] labels = new String[options.length()];
        final boolean[] checked = new boolean[options.length()];
        Set<Integer> unique = new HashSet<>();
        Set<Integer> initial = new HashSet<>();
        try {
            for (int i = 0; i < selected.length(); i++) initial.add(selected.getInt(i));
            if (initial.size() > 3) throw new IllegalArgumentException();
            for (int i = 0; i < options.length(); i++) {
                JSONObject option = options.getJSONObject(i);
                ids[i] = option.getInt("id");
                labels[i] = option.getString("label").trim();
                if (ids[i] <= 0 || !unique.add(ids[i]) || labels[i].isEmpty()) throw new IllegalArgumentException();
                checked[i] = initial.contains(ids[i]);
            }
            if (!unique.containsAll(initial)) throw new IllegalArgumentException();
        } catch (Exception error) {
            call.reject("Opciones de habilidades inválidas.");
            return;
        }
        getActivity().runOnUiThread(() -> {
            if (activeDialog != null || getActivity().isFinishing()) {
                call.reject("Hay otra selección abierta o la pantalla se cerró.");
                return;
            }
            AtomicBoolean completed = new AtomicBoolean(false);
            AlertDialog dialog = new AlertDialog.Builder(getActivity())
                .setTitle("Habilidades · máximo 3")
                .setMultiChoiceItems(labels, checked, (view, which, isChecked) -> {
                    int total = 0;
                    for (boolean value : checked) if (value) total++;
                    if (isChecked && total > 3) {
                        checked[which] = false;
                        ((AlertDialog) view).getListView().setItemChecked(which, false);
                        Toast.makeText(getContext(), "Puedes elegir hasta 3 habilidades", Toast.LENGTH_SHORT).show();
                    }
                })
                .setPositiveButton("Aplicar", (view, which) -> {
                    if (!completed.compareAndSet(false, true)) return;
                    JSArray result = new JSArray();
                    for (int i = 0; i < ids.length; i++) if (checked[i]) result.put(ids[i]);
                    call.resolve(new JSObject().put("confirmed", true).put("selectedIds", result));
                })
                .setNegativeButton("Cancelar", (view, which) -> {
                    if (completed.compareAndSet(false, true)) call.resolve(new JSObject().put("confirmed", false));
                })
                .create();
            dialog.setOnCancelListener(view -> {
                if (completed.compareAndSet(false, true)) call.resolve(new JSObject().put("confirmed", false));
            });
            dialog.setOnDismissListener(view -> {
                if (activeDialog == dialog) activeDialog = null;
                if (completed.compareAndSet(false, true)) call.resolve(new JSObject().put("confirmed", false));
            });
            activeDialog = dialog;
            dialog.show();
            dialog.getListView().setId(R.id.qa12_skill_list);
            dialog.getListView().setContentDescription("Lista de habilidades. Selecciona hasta tres y pulsa Aplicar o Cancelar.");
        });
    }

    @Override
    protected void handleOnDestroy() {
        if (activeDialog != null) getActivity().runOnUiThread(() -> {
            if (activeDialog != null) activeDialog.cancel();
        });
    }
}
