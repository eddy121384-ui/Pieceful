"""Targeted failures for export boundaries, source integrity, and mobile configuration."""
import importlib.util
import json
from pathlib import Path
import subprocess
import sys
import tempfile
import unittest

ROOT = Path(__file__).resolve().parents[1]


def module(name, path):
    spec = importlib.util.spec_from_file_location(name, ROOT / path)
    value = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(value)
    return value


versions = module("release_versions", "tools/mobile/prepare_android_release.py")
plugins = module("release_plugins", "tools/mobile/install_monetization_plugins.py")
checks = module("release_checks", "tools/release/check_repository.py")


class ReleaseReadinessTests(unittest.TestCase):
    def test_mobile_installer_preserves_catalog_export_and_unknown_plugins(self):
        text = '[application]\nconfig/version="0.1.0"\n[editor_plugins]\nenabled=PackedStringArray("res://addons/catalog_source_export/plugin.cfg", "res://custom/plugin.cfg")\n[debug]\nsettings/stdout/print_to_stdout.release=false\n'
        merged = plugins.merged_editor_plugins(text)
        self.assertIn('"res://addons/catalog_source_export/plugin.cfg"', merged)
        self.assertIn('"res://custom/plugin.cfg"', merged)
        self.assertTrue(merged.endswith('[debug]\nsettings/stdout/print_to_stdout.release=false\n'))
        self.assertEqual(merged, plugins.merged_editor_plugins(merged))

    def test_version_update_finds_preset_by_name_and_stops_at_next_section(self):
        text = '[preset.8]\nname="Android Release AAB"\n[preset.8.options]\nversion/code=1\nversion/name="0.1.0-internal"\n[preset.9]\nname="iOS"\n[preset.9.options]\nversion/code=20\nversion/name="unchanged"\n'
        updated = versions._replace_in_release_section(text, "version/code", "42")
        self.assertIn('[preset.8.options]\nversion/code=42', updated)
        self.assertEqual(updated.split('[preset.9]')[1], text.split('[preset.9]')[1])

    def test_invalid_version_inputs_do_not_modify_a_preset(self):
        text = (ROOT / 'export_presets.cfg').read_bytes()
        with tempfile.TemporaryDirectory() as temp:
            path = Path(temp) / 'presets.cfg'
            for code, name in [('0', '0.1.0'), ('2100000001', '0.1.0'), ('1', 'bad\\nname'), ('1', '"quoted"')]:
                path.write_bytes(text)
                result = subprocess.run([sys.executable, str(ROOT / 'tools/mobile/prepare_android_release.py'), '--presets', str(path), '--version-code', code, '--version-name', name], capture_output=True)
                self.assertNotEqual(result.returncode, 0)
                self.assertEqual(path.read_bytes(), text)

    def test_repository_and_catalog_integrity(self):
        self.assertEqual(checks.check()['repository_checks'], 'passed')

    def test_export_contamination_is_rejected(self):
        with tempfile.TemporaryDirectory() as temp:
            root = Path(temp)
            (root / 'project.godot').write_bytes((ROOT / 'project.godot').read_bytes())
            (root / 'export_presets.cfg').write_text((ROOT / 'export_presets.cfg').read_text().replace('tests/*,', '', 1))
            with self.assertRaises(AssertionError):
                checks.check(root)

    def test_failed_qa_export_restores_production_configuration(self):
        project = (ROOT / 'project.godot').read_bytes()
        presets = (ROOT / 'export_presets.cfg').read_bytes()
        with tempfile.TemporaryDirectory() as temp:
            result = subprocess.run([sys.executable, str(ROOT / 'tools/export_product_ux_qa.py'), '--godot', '/bin/false', '--output', str(Path(temp) / 'index.html')], cwd=ROOT, capture_output=True)
        self.assertNotEqual(result.returncode, 0)
        self.assertEqual((ROOT / 'project.godot').read_bytes(), project)
        self.assertEqual((ROOT / 'export_presets.cfg').read_bytes(), presets)

    def test_release_workflow_keeps_dispatch_inputs_out_of_shell_source(self):
        text = (ROOT / '.github/workflows/android-play-internal.yml').read_text()
        self.assertNotIn('--version-code "${{ inputs.', text)
        self.assertNotIn('--version-name "${{ inputs.', text)
        self.assertIn('RELEASE_VERSION_CODE: ${{ inputs.version_code }}', text)


if __name__ == '__main__':
    unittest.main()
