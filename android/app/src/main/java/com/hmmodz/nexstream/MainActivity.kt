package com.hmmodz.nexstream

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyRow
import androidx.compose.foundation.lazy.items
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp

private val AppBg = Color(0xFF09090B)
private val Panel = Color(0xFF18181C)
private val Gold = Color(0xFFD6B45A)

class MainActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContent { NexStreamApp() }
    }
}


@Composable
private fun NexStreamApp() {
    var section by remember { mutableStateOf("Home") }
    val tabs = listOf("Home", "Anime", "Manhwa", "Film", "Library")
    MaterialTheme(colorScheme = darkColorScheme(primary = Gold, background = AppBg, surface = Panel)) {
        Scaffold(containerColor = AppBg, bottomBar = {
            NavigationBar(containerColor = Panel) {
                tabs.forEach { tab ->
                    NavigationBarItem(selected = section == tab, onClick = { section = tab },
                        icon = { Text(tab.take(1), fontWeight = FontWeight.Bold) }, label = { Text(tab) })
                }
            }
        }) { padding ->
            Column(Modifier.fillMaxSize().background(AppBg).padding(padding).padding(horizontal = 20.dp, vertical = 16.dp)) {
                Text("NEXSTREAM", color = Gold, fontWeight = FontWeight.ExtraBold, style = MaterialTheme.typography.titleLarge)
                Text("Anime · Manhwa · Film", color = Color.LightGray, style = MaterialTheme.typography.bodySmall)
                Spacer(Modifier.height(24.dp))
                Text(section, color = Color.White, style = MaterialTheme.typography.headlineMedium, fontWeight = FontWeight.Bold)
                Spacer(Modifier.height(12.dp))
                Text("Discover something to enjoy", color = Color.Gray)
                Spacer(Modifier.height(24.dp))
                LazyRow(horizontalArrangement = Arrangement.spacedBy(10.dp)) {
                    items(listOf("Anime", "Manhwa", "Film")) { item ->
                        Surface(color = Panel, shape = MaterialTheme.shapes.large, onClick = { section = item }) {
                            Text(item, color = Gold, modifier = Modifier.padding(horizontal = 18.dp, vertical = 12.dp))
                        }
                    }
                }
                Spacer(Modifier.height(24.dp))
                Box(Modifier.fillMaxWidth().height(180.dp).background(Panel, MaterialTheme.shapes.extraLarge), contentAlignment = Alignment.Center) {
                    Column(horizontalAlignment = Alignment.CenterHorizontally) {
                        Text("NexStream", color = Color.White, fontWeight = FontWeight.Bold, style = MaterialTheme.typography.titleLarge)
                        Text("Native app foundation", color = Gold)
                    }
                }
                Spacer(Modifier.height(20.dp))
                Text("Catalog", color = Color.White, fontWeight = FontWeight.Bold)
                Spacer(Modifier.height(8.dp))
                Text("The API catalog will appear here once authorized data providers are connected.", color = Color.Gray)
            }
        }
    }
}
